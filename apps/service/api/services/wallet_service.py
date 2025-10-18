"""
Wallet data fetching service using Alchemy API.
Handles streaming wallet data, transfers, NFTs, and token balances.
"""
import asyncio
import aiohttp
from typing import AsyncGenerator, Dict, Any, List, Optional
from decimal import Decimal
from eth_utils import is_address, to_checksum_address
from web3 import Web3

from api.config import settings


class WalletService:
    """Service for fetching wallet data from Ethereum blockchain."""
    
    def __init__(self):
        """Initialize Alchemy connection."""
        self.alchemy_url = f"https://eth-mainnet.g.alchemy.com/v2/{settings.ALCHEMY_API_KEY}"
        self.w3 = Web3(Web3.HTTPProvider(self.alchemy_url))
    
    async def _alchemy_request(self, method: str, params: List[Any]) -> Any:
        """Make a JSON-RPC request to Alchemy API."""
        async with aiohttp.ClientSession() as session:
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": method,
                "params": params
            }
            async with session.post(self.alchemy_url, json=payload) as response:
                result = await response.json()
                if "error" in result:
                    raise Exception(f"Alchemy API error: {result['error']}")
                return result.get("result")
    
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
    
    async def get_metadata(self, address: str) -> Dict[str, Any]:
        """Get wallet metadata (balance, transaction count, ENS)."""
        try:
            balance = self.w3.eth.get_balance(address)
            tx_count = self.w3.eth.get_transaction_count(address)
            
            # Try to get ENS name
            ens_name = None
            try:
                ens_name = self.w3.ens.name(address)
            except Exception:
                pass
            
            return {
                "address": address,
                "ens": ens_name,
                "ethBalance": str(balance),
                "ethBalanceFormatted": str(Web3.from_wei(balance, 'ether')),
                "transactionCount": tx_count
            }
        except Exception as e:
            raise Exception(f"Failed to fetch metadata: {str(e)}")
    
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
        """Call alchemy_getAssetTransfers method."""
        params = [{
            "fromBlock": from_block,
            "toBlock": to_block,
            "category": category or ["external", "internal", "erc20", "erc721", "erc1155"],
            "withMetadata": True,
            "maxCount": hex(max_count)
        }]
        
        if from_address:
            params[0]["fromAddress"] = from_address
        if to_address:
            params[0]["toAddress"] = to_address
        if page_key:
            params[0]["pageKey"] = page_key
        
        return await self._alchemy_request("alchemy_getAssetTransfers", params)
    
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
        """Get ERC-20 token balances for an address."""
        try:
            result = await self._alchemy_request("alchemy_getTokenBalances", [address, "erc20"])
            return {
                "address": address,
                "tokenBalances": result.get("tokenBalances", [])
            }
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
        """
        page_key = None
        page = 0
        total_count = 0
        
        while True:
            page += 1
            
            params = {
                "owner": address,
                "pageSize": page_size
            }
            if page_key:
                params["pageKey"] = page_key
            
            response = await self._alchemy_request("alchemy_getNFTs", [params])
            
            nfts = response.get("ownedNfts", [])
            
            if nfts:
                total_count += len(nfts)
                yield {
                    "page": page,
                    "count": len(nfts),
                    "total": total_count,
                    "totalCount": response.get("totalCount", 0),
                    "data": nfts
                }
            
            page_key = response.get("pageKey")
            if not page_key or not nfts:
                break
            
            await asyncio.sleep(0.2)  # Rate limiting
    
    async def get_derived_stats(
        self,
        address: str,
        transfers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate derived statistics from transfers.
        
        Args:
            address: Ethereum address
            transfers: List of transfer objects
            
        Returns:
            Dictionary with computed statistics
        """
        try:
            total_in = 0
            total_out = 0
            token_contracts = set()
            tx_hashes = set()
            
            address_lower = address.lower()
            
            for transfer in transfers:
                # Track unique transactions
                if transfer.get("hash"):
                    tx_hashes.add(transfer["hash"])
                
                # Track token contracts
                if transfer.get("rawContract", {}).get("address"):
                    token_contracts.add(transfer["rawContract"]["address"])
                
                # Calculate ETH flows (only for external transactions)
                if transfer.get("category") == "external" and transfer.get("value"):
                    try:
                        value_wei = Web3.to_wei(Decimal(str(transfer["value"])), 'ether')
                        
                        if transfer.get("to", "").lower() == address_lower:
                            total_in += value_wei
                        if transfer.get("from", "").lower() == address_lower:
                            total_out += value_wei
                    except Exception:
                        continue
            
            net_eth = total_in - total_out
            
            return {
                "totalEthInWei": str(total_in),
                "totalEthOutWei": str(total_out),
                "totalEthInFormatted": str(Web3.from_wei(total_in, 'ether')),
                "totalEthOutFormatted": str(Web3.from_wei(total_out, 'ether')),
                "netEthFormatted": str(Web3.from_wei(net_eth, 'ether')),
                "tokenContracts": list(token_contracts),
                "totalTransfers": len(transfers),
                "uniqueTransactions": len(tx_hashes)
            }
        except Exception as e:
            raise Exception(f"Failed to calculate derived stats: {str(e)}")


# Global service instance
wallet_service = WalletService()

