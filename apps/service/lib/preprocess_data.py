import os
import json
from langchain_community.utilities import SQLDatabase

# --- Configuration ---
DATA_DIR = "./wallet_dump_d8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
DB_PATH = "sqlite:///nl_to_sql.db"

def get_schema():
    """
    Returns the new CREATE TABLE statements for the Hybrid Model (Approach B).
    We use TEXT for JSONB-like storage in SQLite.
    """
    return """
    CREATE TABLE wallets (
        address TEXT PRIMARY KEY
    );

    CREATE TABLE token_balances (
        wallet_address TEXT NOT NULL,
        contract_address TEXT NOT NULL,
        raw_balance TEXT,
        PRIMARY KEY (wallet_address, contract_address),
        FOREIGN KEY (wallet_address) REFERENCES wallets(address)
    );

    CREATE TABLE transactions (
        hash TEXT PRIMARY KEY,
        block_number INTEGER,
        from_address TEXT,
        to_address TEXT,
        status INTEGER,
        tx_data TEXT, -- Stores the 'tx' JSON object
        receipt_data TEXT -- Stores the 'receipt' JSON object
    );

    CREATE TABLE nfts (
        wallet_address TEXT NOT NULL,
        contract_address TEXT NOT NULL,
        token_id TEXT NOT NULL,
        name TEXT,
        collection_name TEXT,
        raw_metadata TEXT, -- Stores the entire NFT JSON object
        PRIMARY KEY (wallet_address, contract_address, token_id),
        FOREIGN KEY (wallet_address) REFERENCES wallets(address)
    );
    """

def setup_database_schema(database: SQLDatabase):
    """
    Executes each CREATE TABLE statement individually.
    """
    print("-> Setting up new database schema (Hybrid Model)...")
    schema_string = get_schema()
    statements = [s.strip() for s in schema_string.split(';') if s.strip()]
    for stmt in statements:
        try:
            modified_stmt = stmt.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS")
            database.run(modified_stmt)
        except Exception as e:
            print(f"Error executing statement: {stmt}\n{e}")
    print("-> Schema setup complete.")

def load_data_from_json(database: SQLDatabase):
    """
    Loads data from the JSON files into the new hybrid schema.
    """
    print("-> Loading data from JSON files...")
    
    wallet_address = None

    # 1. Load Token Balances and establish the primary wallet
    try:
        with open(os.path.join(DATA_DIR, 'tokenBalances.json'), 'r') as f:
            data = json.load(f)
        
        wallet_address = data.get('address')
        if not wallet_address:
            raise ValueError("Wallet address not found in tokenBalances.json")

        database.run(
            "INSERT OR IGNORE INTO wallets (address) VALUES (:address);",
            parameters={"address": wallet_address}
        )
        print(f"-> Ensured wallet exists: {wallet_address}")

        for balance in data.get('tokenBalances', []):
            database.run(
                """
                INSERT OR IGNORE INTO token_balances (wallet_address, contract_address, raw_balance)
                VALUES (:wallet, :contract, :balance);
                """,
                parameters={
                    "wallet": wallet_address,
                    "contract": balance.get('contractAddress'),
                    "balance": balance.get('tokenBalance')
                }
            )
        print(f"-> Loaded {len(data.get('tokenBalances', []))} token balances.")

    except Exception as e:
        print(f"FATAL: Could not process tokenBalances.json. Error: {e}")
        return

    # 2. Load Transactions
    try:
        with open(os.path.join(DATA_DIR, 'txs_receipts_traces.json'), 'r') as f:
            tx_data = json.load(f)
        
        for record in tx_data:
            tx = record.get('tx', {})
            receipt = record.get('receipt', {})
            if not tx.get('hash'): continue

            database.run(
                """
                INSERT OR IGNORE INTO transactions (hash, block_number, from_address, to_address, status, tx_data, receipt_data)
                VALUES (:hash, :block_num, :from, :to, :status, :tx_json, :receipt_json);
                """,
                parameters={
                    "hash": tx.get('hash'),
                    "block_num": tx.get('blockNumber'),
                    "from": tx.get('from'),
                    "to": tx.get('to'),
                    "status": receipt.get('status'),
                    "tx_json": json.dumps(tx),
                    "receipt_json": json.dumps(receipt)
                }
            )
        print(f"-> Loaded {len(tx_data)} transactions.")
    except Exception as e:
        print(f"Error loading transactions: {e}")

    # 3. Load NFTs
    try:
        with open(os.path.join(DATA_DIR, 'nfts.json'), 'r') as f:
            nft_data = json.load(f)

        # **THE FIX**: Iterate over the 'ownedNfts' list within the JSON object.
        owned_nfts_list = nft_data.get('ownedNfts', [])
        loaded_count = 0
        
        for nft in owned_nfts_list:
            # Ensure the 'nft' item is a dictionary.
            if not isinstance(nft, dict):
                continue

            contract_obj = nft.get('contract')
            collection_obj = nft.get('collection')
            
            contract_address = contract_obj.get('address') if isinstance(contract_obj, dict) else None
            collection_name = collection_obj.get('name') if isinstance(collection_obj, dict) else None
            token_id = nft.get('tokenId')

            if not contract_address or not token_id:
                continue
            
            database.run(
                """
                INSERT OR IGNORE INTO nfts (wallet_address, contract_address, token_id, name, collection_name, raw_metadata)
                VALUES (:wallet, :contract, :token_id, :name, :collection, :metadata);
                """,
                parameters={
                    "wallet": wallet_address,
                    "contract": contract_address,
                    "token_id": token_id,
                    "name": nft.get('name'),
                    "collection": collection_name,
                    "metadata": json.dumps(nft)
                }
            )
            loaded_count += 1
        print(f"-> Successfully loaded {loaded_count}/{len(owned_nfts_list)} NFTs.")
    except Exception as e:
        print(f"Error loading NFTs: {e}")


if __name__ == "__main__":
    db_file = DB_PATH.replace("sqlite:///", "")
    if os.path.exists(db_file):
        print(f"-> Removing existing database file: {db_file}")
        os.remove(db_file)

    print("--- Starting Data Pre-processing ---")
    db = SQLDatabase.from_uri(DB_PATH)
    setup_database_schema(db)
    load_data_from_json(db)
    print("--- Data Pre-processing Complete ---")