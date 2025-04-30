from brownie import Market, StoreFactory, AuctionMarket, Administration, MockV3Aggregator, network, config
from scripts.helper_scripts import get_account, LOCAL_BLOCKCHAINS, deploy_mock
import json
import os

def deploy():
    admin = get_account()

    if network.show_active() in LOCAL_BLOCKCHAINS:
        price_feed = deploy_mock()
    else:
        price_feed_address = config["networks"][network.show_active()]["eth-usd-feed"]
        price_feed = MockV3Aggregator.at(price_feed_address)

    administration = Administration.deploy(price_feed.address, {"from": admin})
    market = Market.deploy(administration.address, {"from": admin})
    store_factory = StoreFactory.deploy(administration.address, {"from": admin})
    auction_market = AuctionMarket.deploy(administration.address, {"from": admin})

    administration.setMarketContractAddress(market.address, {"from": admin})
    administration.setStoreFactoryAddress(store_factory.address, {"from": admin})
    administration.setAuctionMarketContractAddress(auction_market.address, {"from": admin})

    # Save deployment addresses
    save_deployment_map({
        "Administration": [administration.address],
        "Market": [market.address],
        "StoreFactory": [store_factory.address],
        "AuctionMarket": [auction_market.address],
        "MockV3Aggregator": [price_feed.address],
    })

def save_deployment_map(new_data):
    chain_id = str(network.chain.id)
    path = path = "./front-end/src/artifacts/deployments/map.json"
    os.makedirs(os.path.dirname(path), exist_ok=True)

    if os.path.exists(path):
        with open(path, "r") as f:
            deployment_map = json.load(f)
    else:
        deployment_map = {}

    deployment_map[chain_id] = new_data

    with open(path, "w") as f:
        json.dump(deployment_map, f, indent=2)

def main():
    deploy()
