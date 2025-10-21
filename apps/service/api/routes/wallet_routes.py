"""
API routes for wallet data endpoints.
Provides streaming and parallel-fetch endpoints for blockchain data.
"""
import json
import asyncio
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from api.services.wallet_service import wallet_service

router = APIRouter(prefix="/api/v1/wallet", tags=["wallet"])


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
                # Yield the data
                data = f"data: {json.dumps(batch)}\n\n"
                yield data.encode('utf-8')
                
                # Force a small delay to allow the response to flush
                await asyncio.sleep(0.01)
            
            # Send completion message
            completion = f"data: {json.dumps({'type': 'complete', 'message': 'Transfer fetch complete'})}\n\n"
            yield completion.encode('utf-8')
        except Exception as e:
            error = f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            yield error.encode('utf-8')
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.get("/{address}/tokens")
async def get_wallet_token_balances(address: str):
    """
    Get ERC-20 token balances with metadata and prices for a wallet.
    Returns enriched token data including metadata, prices, and network information.
    
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
                # Yield the data
                data = f"data: {json.dumps(batch)}\n\n"
                yield data.encode('utf-8')
                
                # Force a small delay to allow the response to flush
                await asyncio.sleep(0.01)
            
            # Send completion message
            completion = f"data: {json.dumps({'type': 'complete', 'message': 'NFT fetch complete'})}\n\n"
            yield completion.encode('utf-8')
        except Exception as e:
            error = f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            yield error.encode('utf-8')
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.get("/{address}/full")
async def get_wallet_full_data(
    address: str,
    include_nft: bool = Query(False, description="Include NFT data (default: false for performance)"),
    max_transfers: int = Query(100, description="Max transfers per direction (default: 100, max: 10000)"),
    direction: str = Query("both", description="Direction: 'from', 'to', or 'both'")
):
    """
    Get wallet data in one request (not streaming).
    For large wallets or more data, use the individual streaming endpoints.
    
    Args:
        address: Ethereum address or ENS name
        include_nft: Include NFT data (default: false for performance)
        max_transfers: Maximum transfers per direction (default: 100, capped at 10000)
        direction: Transfer direction - "from", "to", or "both"
    
    Returns:
        Wallet data including limited transfers, tokens, and optionally NFTs
    """
    if direction not in ["from", "to", "both"]:
        raise HTTPException(status_code=400, detail="direction must be 'from', 'to', or 'both'")
    
    # Cap max_transfers at 10000 per direction to prevent timeouts
    max_transfers = min(max_transfers, 10000) if max_transfers > 0 else 100
    
    try:
        resolved_address = await wallet_service.resolve_address(address)
        
        # Run all fetches in parallel using asyncio.gather
        async def fetch_transfers():
            transfers = []
            count = 0
            async for batch in wallet_service.stream_transfers(
                resolved_address,
                "0x0",
                max_transfers,
                False,  # Don't include NFTs in transfers
                direction
            ):
                transfers.extend(batch.get("data", []))
                count += 1
                # Limit to prevent too many batches
                if count >= 10:  # Max 10 batches
                    break
            return transfers
        
        async def fetch_nfts():
            if not include_nft:
                return None
            nfts = []
            count = 0
            async for batch in wallet_service.stream_nfts(resolved_address, page_size=100):
                nfts.extend(batch.get("data", []))
                count += 1
                # Limit to first 200 NFTs (2 batches)
                if count >= 2:
                    break
            return {"ownedNfts": nfts, "totalCount": len(nfts)}
        
        # Fetch all data in parallel
        transfers, token_balances, nfts = await asyncio.gather(
            fetch_transfers(),
            wallet_service.get_token_balances(resolved_address),
            fetch_nfts(),
            return_exceptions=False
        )
        
        return {
            "transfers": transfers,
            "tokenBalances": token_balances,
            "nfts": nfts
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch wallet data: {str(e)}")

