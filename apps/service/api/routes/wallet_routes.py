"""
API routes for wallet data endpoints.
Provides streaming and parallel-fetch endpoints for blockchain data.
"""
import json
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from api.services.wallet_service import wallet_service

router = APIRouter(prefix="/api/v1/wallet", tags=["wallet"])


class WalletMetadataResponse(BaseModel):
    """Response model for wallet metadata."""
    address: str
    ens: Optional[str] = None
    ethBalance: str
    ethBalanceFormatted: str
    transactionCount: int


class TokenBalancesResponse(BaseModel):
    """Response model for token balances."""
    address: str
    tokenBalances: List[Dict[str, Any]]


class DerivedStatsResponse(BaseModel):
    """Response model for derived statistics."""
    totalEthInWei: str
    totalEthOutWei: str
    totalEthInFormatted: str
    totalEthOutFormatted: str
    netEthFormatted: str
    tokenContracts: List[str]
    totalTransfers: int
    uniqueTransactions: int


@router.get("/{address}/metadata", response_model=WalletMetadataResponse)
async def get_wallet_metadata(address: str):
    """
    Get wallet metadata including balance, transaction count, and ENS.
    
    Args:
        address: Ethereum address or ENS name
    """
    try:
        resolved_address = await wallet_service.resolve_address(address)
        metadata = await wallet_service.get_metadata(resolved_address)
        return metadata
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch metadata: {str(e)}")


@router.get("/{address}/transfers/stream")
async def stream_wallet_transfers(
    address: str,
    from_block: str = Query("0x0", description="Starting block (hex)"),
    max_transfers: int = Query(0, description="Max transfers per direction (0 = unlimited)"),
    include_nft: bool = Query(True, description="Include NFT transfers"),
    direction: str = Query("both", description="Direction: 'from', 'to', or 'both'")
):
    """
    Stream wallet transfers as they're fetched.
    Returns Server-Sent Events (SSE) stream with batches of 1000 transfers.
    
    Args:
        address: Ethereum address or ENS name
        from_block: Starting block in hex (default: 0x0)
        max_transfers: Maximum transfers per direction (0 = unlimited)
                      - direction="both": fetches max_transfers from + max_transfers to
                      - direction="from"/"to": fetches max_transfers total
        include_nft: Include ERC721/ERC1155 transfers
        direction: Transfer direction - "from", "to", or "both" (default: "both")
    
    Examples:
        - direction="both", max_transfers=1000: Returns up to 1000 from + 1000 to = 2000 total
        - direction="from", max_transfers=1000: Returns up to 1000 from transfers only
        - direction="to", max_transfers=1000: Returns up to 1000 to transfers only
    """
    if direction not in ["from", "to", "both"]:
        raise HTTPException(status_code=400, detail="direction must be 'from', 'to', or 'both'")
    
    try:
        resolved_address = await wallet_service.resolve_address(address)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    async def event_generator():
        try:
            async for batch in wallet_service.stream_transfers(
                resolved_address,
                from_block,
                max_transfers,
                include_nft,
                direction
            ):
                yield f"data: {json.dumps(batch)}\n\n"
            
            yield f"data: {json.dumps({'type': 'complete', 'message': 'Transfer fetch complete'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/{address}/tokens", response_model=TokenBalancesResponse)
async def get_wallet_token_balances(address: str):
    """
    Get ERC-20 token balances for a wallet.
    
    Args:
        address: Ethereum address or ENS name
    """
    try:
        resolved_address = await wallet_service.resolve_address(address)
        balances = await wallet_service.get_token_balances(resolved_address)
        return balances
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch token balances: {str(e)}")


@router.get("/{address}/nfts/stream")
async def stream_wallet_nfts(
    address: str,
    page_size: int = Query(100, ge=1, le=100, description="NFTs per batch")
):
    """
    Stream NFTs owned by a wallet.
    Returns Server-Sent Events (SSE) stream with batches of NFTs.
    
    Args:
        address: Ethereum address or ENS name
        page_size: Number of NFTs per batch (max 100)
    """
    try:
        resolved_address = await wallet_service.resolve_address(address)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    async def event_generator():
        try:
            async for batch in wallet_service.stream_nfts(resolved_address, page_size):
                yield f"data: {json.dumps(batch)}\n\n"
            
            yield f"data: {json.dumps({'type': 'complete', 'message': 'NFT fetch complete'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.post("/{address}/stats", response_model=DerivedStatsResponse)
async def calculate_derived_stats(
    address: str,
    transfers: List[Dict[str, Any]]
):
    """
    Calculate derived statistics from transfer data.
    
    Args:
        address: Ethereum address
        transfers: List of transfer objects (from transfers endpoint)
    """
    try:
        resolved_address = await wallet_service.resolve_address(address)
        stats = await wallet_service.get_derived_stats(resolved_address, transfers)
        return stats
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate stats: {str(e)}")


@router.get("/{address}/full")
async def get_wallet_full_data(
    address: str,
    include_nft: bool = Query(True, description="Include NFT data"),
    max_transfers: int = Query(0, description="Max transfers per direction (0 = unlimited)"),
    direction: str = Query("both", description="Direction: 'from', 'to', or 'both'")
):
    """
    Get all wallet data in one request (not streaming).
    For large wallets, use the individual streaming endpoints instead.
    
    Args:
        address: Ethereum address or ENS name
        include_nft: Include NFT data
        max_transfers: Maximum transfers per direction (0 = unlimited)
        direction: Transfer direction - "from", "to", or "both"
    
    Returns:
        Complete wallet data including metadata, transfers, tokens, and NFTs
    """
    if direction not in ["from", "to", "both"]:
        raise HTTPException(status_code=400, detail="direction must be 'from', 'to', or 'both'")
    
    try:
        resolved_address = await wallet_service.resolve_address(address)
        
        # Fetch metadata
        metadata = await wallet_service.get_metadata(resolved_address)
        
        # Collect all transfers
        all_transfers = []
        async for batch in wallet_service.stream_transfers(
            resolved_address,
            "0x0",
            max_transfers,
            include_nft,
            direction
        ):
            all_transfers.extend(batch.get("data", []))
        
        # Fetch token balances
        token_balances = await wallet_service.get_token_balances(resolved_address)
        
        # Fetch NFTs if requested
        nfts = None
        if include_nft:
            all_nfts = []
            async for batch in wallet_service.stream_nfts(resolved_address):
                all_nfts.extend(batch.get("data", []))
            nfts = {"ownedNfts": all_nfts, "totalCount": len(all_nfts)}
        
        # Calculate derived stats
        derived_stats = await wallet_service.get_derived_stats(resolved_address, all_transfers)
        
        return {
            "metadata": metadata,
            "transfers": all_transfers,
            "tokenBalances": token_balances,
            "nfts": nfts,
            "derivedStats": derived_stats
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch wallet data: {str(e)}")

