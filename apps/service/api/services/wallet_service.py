"""
Wallet data fetching service using Alchemy SDK.
Handles streaming wallet data, transfers, NFTs, and token balances.
"""
import asyncio
import aiohttp
from typing import AsyncGenerator, Dict, Any, List, Optional
from decimal import Decimal
from eth_utils import is_address, to_checksum_address
from web3 import Web3
from alchemy import Alchemy, Network

from api.config import settings


class WalletService:
    """Service for fetching wallet data from Ethereum blockchain."""
    
    def __init__(self):
        """Initialize Alchemy connection."""
        self.alchemy_url = f"https://eth-mainnet.g.alchemy.com/v2/{settings.ALCHEMY_API_KEY}"
        self.w3 = Web3(Web3.HTTPProvider(self.alchemy_url))
        self.alchemy = Alchemy(api_key=settings.ALCHEMY_API_KEY, network=Network.ETH_MAINNET)
    
    def _serialize_sdk_response(self, obj: Any) -> Any:
        """
        Convert Alchemy SDK response objects to JSON-serializable dictionaries.
        
        Args:
            obj: SDK response object
            
        Returns:
            JSON-serializable dict or list
        """
        if obj is None:
            return None
        
        # If it's already a dict, list, str, int, float, bool, return as-is
        if isinstance(obj, (dict, list, str, int, float, bool, type(None))):
            if isinstance(obj, dict):
                return {k: self._serialize_sdk_response(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [self._serialize_sdk_response(item) for item in obj]
            return obj
        
        # Try model_dump() for Pydantic models
        if hasattr(obj, 'model_dump'):
            return obj.model_dump()
        
        # Try dict() conversion
        if hasattr(obj, '__dict__'):
            return self._serialize_sdk_response(vars(obj))
        
        # Convert to string as fallback
        return str(obj)
    
    async def resolve_address(self, input_str: str) -> str:
        """
        Resolve ENS name to address or validate address.
        
        Args:
            input_str: Address or ENS name
            
        Returns:
            Checksummed Ethereum address
        """
        # Check if it's already a valid address
        if is_address(input_str):
            return to_checksum_address(input_str)
        
        # Try to resolve as ENS
        try:
            resolved = self.w3.ens.address(input_str)
            if resolved:
                return to_checksum_address(resolved)
        except Exception:
            pass
        
        raise ValueError(f"Invalid address or ENS name: {input_str}")
    
    async def _get_asset_transfers(
        self,
        from_block: str,
        to_block: str,
        from_address: Optional[str] = None,
        to_address: Optional[str] = None,
        category: List[str] = None,
        page_key: Optional[str] = None,
        max_count: int = 1000
    ) -> Dict[str, Any]:
        """Get asset transfers using Alchemy REST API."""
        # Build params for the API
        params = {
            "fromBlock": from_block,
            "toBlock": to_block,
            "category": category or ["external", "internal", "erc20", "erc721", "erc1155"],
            "withMetadata": True,
            "maxCount": hex(max_count)
        }
        
        if from_address:
            params["fromAddress"] = from_address
        if to_address:
            params["toAddress"] = to_address
        if page_key:
            params["pageKey"] = page_key
        
        # Use Alchemy REST API
        url = f"https://eth-mainnet.g.alchemy.com/v2/{settings.ALCHEMY_API_KEY}"
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "alchemy_getAssetTransfers",
            "params": [params]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status != 200:
                    raise Exception(f"Alchemy API returned status {response.status}")
                
                data = await response.json()
                
                if "error" in data:
                    raise Exception(f"Alchemy API error: {data['error']}")
                
                return data.get("result", {})
    
    async def stream_transfers(
        self,
        address: str,
        from_block: str = "0x0",
        max_transfers: int = 0,
        include_nft: bool = True,
        direction: str = "both"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream asset transfers for an address.
        Yields batches of transfers as they're fetched.
        
        Args:
            address: Ethereum address
            from_block: Starting block (default: genesis)
            max_transfers: Max transfers to fetch per direction (0 = unlimited)
                         - For "both": fetches max_transfers from + max_transfers to
                         - For "from"/"to": fetches max_transfers total
            include_nft: Include NFT transfers (ERC721, ERC1155)
            direction: Transfer direction - "from", "to", or "both"
        """
        categories = ["external", "internal", "erc20"]
        if include_nft:
            categories.extend(["erc721", "erc1155"])
        
        # Fetch "from" transfers if requested
        if direction in ["from", "both"]:
            page_key = None
            page = 0
            from_total = 0
            
            while True:
                if max_transfers > 0 and from_total >= max_transfers:
                    break
                
                page += 1
                
                # Use Alchemy API to get transfers
                response = await self._get_asset_transfers(
                    from_block=from_block,
                    to_block="latest",
                    from_address=address,
                    category=categories,
                    page_key=page_key,
                    max_count=1000
                )
                
                transfers = response.get("transfers", [])
                
                if max_transfers > 0:
                    remaining = max_transfers - from_total
                    transfers = transfers[:remaining]
                
                if transfers:
                    from_total += len(transfers)
                    yield {
                        "type": "from_transfers",
                        "page": page,
                        "count": len(transfers),
                        "total": from_total,
                        "direction": "from",
                        "data": transfers
                    }
                
                page_key = response.get("pageKey")
                if not page_key or not transfers:
                    break
                
                await asyncio.sleep(0.2)  # Rate limiting
        
        # Fetch "to" transfers if requested
        if direction in ["to", "both"]:
            page_key = None
            page = 0
            to_total = 0
            
            while True:
                if max_transfers > 0 and to_total >= max_transfers:
                    break
                
                page += 1
                
                response = await self._get_asset_transfers(
                    from_block=from_block,
                    to_block="latest",
                    to_address=address,
                    category=categories,
                    page_key=page_key,
                    max_count=1000
                )
                
                transfers = response.get("transfers", [])
                
                if max_transfers > 0:
                    remaining = max_transfers - to_total
                    transfers = transfers[:remaining]
                
                if transfers:
                    to_total += len(transfers)
                    yield {
                        "type": "to_transfers",
                        "page": page,
                        "count": len(transfers),
                        "total": to_total,
                        "direction": "to",
                        "data": transfers
                    }
                
                page_key = response.get("pageKey")
                if not page_key or not transfers:
                    break
                
                await asyncio.sleep(0.2)  # Rate limiting
    
    async def get_token_balances(self, address: str) -> Dict[str, Any]:
        """Get ERC-20 token balances with metadata and prices using Alchemy Assets API."""
        try:
            # Use Alchemy Assets API for enriched token data
            url = f"https://api.g.alchemy.com/data/v1/{settings.ALCHEMY_API_KEY}/assets/tokens/balances/by-address"
            
            payload = {
                "addresses": [
                    {
                        "address": address,
                        "networks": ["eth-mainnet"]
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status != 200:
                        text = await response.text()
                        raise Exception(f"Alchemy API returned status {response.status}: {text}")
                    
                    data = await response.json()
                    
                    if "error" in data:
                        raise Exception(f"Alchemy API error: {data['error']}")
                    
                    return data
        except Exception as e:
            raise Exception(f"Failed to fetch token balances: {str(e)}")
    
    async def stream_nfts(
        self,
        address: str,
        page_size: int = 100
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream NFTs owned by an address.
        Yields batches of NFTs as they're fetched.
        Uses Alchemy REST API directly.
        """
        page_key = None
        page = 0
        total_count = 0
        
        # Use Alchemy REST API v3 endpoint
        url = f"https://eth-mainnet.g.alchemy.com/nft/v3/{settings.ALCHEMY_API_KEY}/getNFTsForOwner"
        
        async with aiohttp.ClientSession() as session:
            while True:
                page += 1
                
                try:
                    # Build request params
                    params = {
                        "owner": address,
                        "pageSize": str(page_size)
                    }
                    if page_key:
                        params["pageKey"] = page_key
                    
                    # Make API request
                    async with session.get(url, params=params) as response:
                        if response.status != 200:
                            raise Exception(f"Alchemy API returned status {response.status}")
                        
                        data = await response.json()
                        
                        if "error" in data:
                            raise Exception(f"Alchemy API error: {data['error']}")
                        
                        nfts = data.get("ownedNfts", [])
                        total_nft_count = data.get("totalCount", 0)
                        
                        # Always yield data, even if empty (for first page)
                        total_count += len(nfts)
                        yield {
                            "page": page,
                            "count": len(nfts),
                            "total": total_count,
                            "totalCount": total_nft_count,
                            "data": nfts
                        }
                        
                        page_key = data.get("pageKey")
                        if not page_key or not nfts:
                            break
                        
                        await asyncio.sleep(0.2)  # Rate limiting
                except Exception as e:
                    raise Exception(f"Failed to fetch NFTs: {str(e)}")


# Global service instance
wallet_service = WalletService()

