// Updated Home.js with Search Bar above Products

import "bootstrap/dist/css/bootstrap.css";
import React, { useEffect, useState } from "react";
import { ethers, utils } from "ethers";
import axios from "axios";
import { makeStyles } from "@material-ui/core";
import { useSelector } from "react-redux";
import { Card, Container, Row, Col, Form } from "react-bootstrap";

import { IPFS_GATEWAY } from "../utils/ipfsStorage";
import MarketContract from "../artifacts/contracts/Market.json";
import StoreFactoryContract from "../artifacts/contracts/StoreFactory.json";
import AuctionContract from "../artifacts/contracts/AuctionMarket.json";
import StoreContract from "../artifacts/contracts/Store.json";
import contractsAddress from "../artifacts/deployments/map.json";
import networks from "../utils/networksMap.json";

const Marketaddress = contractsAddress["5777"]["Market"][0];
const factoryAddress = contractsAddress["5777"]["StoreFactory"][0];
const auctionContractAddress = contractsAddress["5777"]["AuctionMarket"][0];
const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const useStyles = makeStyles((theme) => ({
  Container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

function Home() {
  const classes = useStyles();
  const data = useSelector((state) => state.blockchain.value);
  const [wishlist, setWishlist] = useState([]);
  const wishlistKey = `wishlist_${data.account}`;
  const cartKey = `cart_${data.account}`;
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedWishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    const storedCart = JSON.parse(localStorage.getItem(cartKey)) || [];
    setWishlist(storedWishlist);
    setCart(storedCart);
  }, [data.account]);

  const toggleWishlist = (productId) => {
    let updated;
    if (wishlist.includes(productId)) {
      updated = wishlist.filter((id) => id !== productId);
    } else {
      updated = [...wishlist, productId];
    }
    setWishlist(updated);
    localStorage.setItem(wishlistKey, JSON.stringify(updated));
  };

  const toggleCart = (product) => {
    const exists = cart.find((item) => item.productId === product.productId);
    let updated;
    if (exists) {
      updated = cart.filter((item) => item.productId !== product.productId);
    } else {
      updated = [...cart, product];
    }
    setCart(updated);
    localStorage.setItem(cartKey, JSON.stringify(updated));
  };

  async function loadAuctions() {
    const signer = provider.getSigner();
    const market = new ethers.Contract(
      auctionContractAddress,
      AuctionContract.abi,
      signer
    );
    const allAuctions = await market.getAuctionsList();
    const openAuctions = allAuctions.filter((p) => p[7] === 0);

    if (openAuctions !== undefined) {
      const items = await Promise.all(
        openAuctions.map(async (auction) => {
          const metadataUrl = auction[2].replace("ipfs://", IPFS_GATEWAY);
          let itemMetaData = await axios.get(metadataUrl);
          const imgUrl = itemMetaData.data.image.replace("ipfs://", IPFS_GATEWAY);

          return {
            auctionId: Number(auction[0]),
            name: itemMetaData.data.name,
            image: imgUrl,
            price: utils.formatUnits(auction[4].toString(), "ether"),
          };
        })
      );
      setAuctions(items.reverse());
    }
  }

  async function loadProducts() {
    const signer = provider.getSigner();
    const market = new ethers.Contract(Marketaddress, MarketContract.abi, signer);
    const products = await market.getAllProducts();
    const inSaleProducts = products.filter((p) => p[8] === 1);

    const _marketProducts = inSaleProducts.map((p) => ({
      productId: Number(p[0]),
      seller: p[1],
      name: p[2],
      image: p[4].replace("ipfs://", IPFS_GATEWAY),
      price: utils.formatUnits(p[5].toString(), "ether"),
      date: Number(p[9]),
    }));

    const factory = new ethers.Contract(factoryAddress, StoreFactoryContract.abi, signer);
    const marketStores = await factory.getAllStores();

    let _allStoresProducts = [];
    await Promise.all(
      marketStores.map(async (store) => {
        const productStore = new ethers.Contract(store.storeAddress, StoreContract.abi, signer);
        const _storeProducts = await productStore.listStoreProducts();

        _storeProducts.forEach((p) => {
          _allStoresProducts.push({
            store: store.storeAddress,
            productId: Number(p[0]),
            name: p[1],
            image: p[3].replace("ipfs://", IPFS_GATEWAY),
            price: utils.formatUnits(p[4].toString(), "ether"),
            date: Number(p[8]),
          });
        });
      })
    );

    const _allProducts = [..._marketProducts, ..._allStoresProducts].sort((a, b) => b.date - a.date);
    setProducts(_allProducts);

    const allStores = await Promise.all(
      marketStores.map(async (store) => {
        const productStore = new ethers.Contract(store.storeAddress, StoreContract.abi, signer);
        const storeDetailsURL = await productStore.callStatic.storeMetaData();
        const metadataUrl = storeDetailsURL.replace("ipfs://", IPFS_GATEWAY);
        const meta = await axios.get(metadataUrl);
        return {
          address: store.storeAddress,
          name: meta.data.name,
          image: meta.data.image.replace("ipfs://", IPFS_GATEWAY),
        };
      })
    );
    setAllStores(allStores);
  }

  const currentNetwork = networks["1337"];
  const isGoodNet = data.network === currentNetwork;
  const isConnected = data.account !== "";

  useEffect(() => {
    loadProducts();
    loadAuctions();
  }, []);

  const filteredProducts = [...products].sort((a, b) => {
    if (searchQuery && a.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return -1;
    }
    return 1;
  });

  return (
    <div className={classes.Container}>
      {isConnected ? (
        isGoodNet ? (
          <>
            
<Container>
  <Row className="mt-4">
    <Col md="auto">
      <Form.Control
        type="text"
        placeholder="Search by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: "260px" }}
         
      />
    </Col>
  </Row>
</Container>


            {/* Products Section */}
            {products.length !== 0 && (
              <Container>
                <Row className="mt-4">
                  {filteredProducts.map((product, id) => (
                    <Col style={{ marginBottom: "30px" }} md={3} key={id}>
                      <Card style={{ width: "16rem" }}>
                        <Card.Img variant="top" src={product.image} height="260px" />
                        <Card.Body>
                          <Card.Title style={{ fontSize: "18px" }}>{product.name}</Card.Title>
                          <Card.Text>{product.price} $</Card.Text>
                          <div className="d-flex flex-column gap-2">
                            <a
                              className="btn btn-primary"
                              href={
                                product.store !== undefined
                                  ? `/store-product/${product.store}/${product.productId}`
                                  : `/products/${product.productId}`
                              }
                            >
                              See More
                            </a>

                            <button
                              className={`btn ${wishlist.includes(product.productId) ? "btn-warning" : "btn-outline-secondary"}`}
                              onClick={() => toggleWishlist(product.productId)}
                            >
                              ⭐ Wishlist
                            </button>

                            {product.seller && product.seller.toLowerCase() === data.account?.toLowerCase() ? (
                              <div className="mt-2 text-muted text-center" style={{ fontSize: "14px" }}>
                                📦 Listed by you
                              </div>
                            ) : (
                              <button
                                className={`btn ${
                                  cart.find((item) => item.productId === product.productId)
                                    ? "btn-success"
                                    : "btn-outline-success"
                                }`}
                                onClick={() => toggleCart(product)}
                              >
                                {cart.find((item) => item.productId === product.productId) ? "Added to Cart 🛒" : "Add to Cart"}
                              </button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Container>
            )}


            {/* Stores Section */}
            {allStores.length !== 0 && (
              <Container>
                <h4 className="p-3">Stores</h4>
                <Row className="mt-3">
                  {allStores.map((store, id) => (
                    <Col style={{ marginBottom: "40px" }} md={3} key={id}>
                      <Card style={{ width: "16rem" }}>
                        <Card.Img variant="top" src={store.image} height="230px" />
                        <Card.Body>
                          <Card.Title className="text-center">
                            <a
                              href={`/store/${store.address}`}
                              style={{ textDecoration: "none", color: "black" }}
                            >
                              {store.name}
                            </a>
                          </Card.Title>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Container>
            )}

            {/* Auctions Section */}
            {auctions.length !== 0 && (
              <Container>
                <h4 className="p-3">Auction Market</h4>
                <Row className="mt-3">
                  {auctions.map((auction, id) => (
                    <Col style={{ marginBottom: "40px" }} md={3} key={id}>
                      <Card style={{ width: "16rem" }}>
                        <Card.Img variant="top" src={auction.image} height="250x" />
                        <Card.Body>
                          <Card.Title style={{ fontSize: "18px" }}>{auction.name}</Card.Title>
                          <Card.Text>{parseFloat(auction.price).toFixed(3)} ETH</Card.Text>
                          <a className="btn btn-primary" href={`/auctions/${auction.auctionId}`}>
                            See More
                          </a>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Container>
            )}
          </>
        ) : (
          <div className={classes.Container}>
            You are on the wrong network. Please switch to {currentNetwork} network.
          </div>
        )
      ) : null}
    </div>
  );
}

export default Home;
