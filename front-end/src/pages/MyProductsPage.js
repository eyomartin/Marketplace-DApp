import "bootstrap/dist/css/bootstrap.css";
import React, { useEffect, useState } from "react";
import { ethers, utils } from "ethers";
import { makeStyles, Tab } from "@material-ui/core";
import { Card, Container, Row, Col, Button } from "react-bootstrap";
import { TabContext, TabList, TabPanel } from "@material-ui/lab";
import { useSelector } from "react-redux";

import { IPFS_GATEWAY } from "../utils/ipfsStorage";
import MarketContract from "../artifacts/contracts/Market.json";
import StoreFactoryContract from "../artifacts/contracts/StoreFactory.json";
import StoreContract from "../artifacts/contracts/Store.json";
import contractsAddress from "../artifacts/deployments/map.json";
import networks from "../utils/networksMap.json";

const Marketaddress = contractsAddress["5777"]["Market"][0];
const factoryAddress = contractsAddress["5777"]["StoreFactory"][0];

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const productStatus = { 1: "IN SALE", 2: "PENDING", 3: "SENT", 4: "SOLD" };
const orderStatus = { 0: "PENDING", 1: "SENT", 2: "COMPLETED" };

const useStyles = makeStyles((theme) => ({
  Container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

function MyProductsPage() {
  const classes = useStyles();
  const data = useSelector((state) => state.blockchain.value);

  const [saleProducts, setSaleProducts] = useState([]);
  const [buyProducts, setBuyProducts] = useState([]);
  const [currentTab, setCurrentTab] = useState("sell");

  async function removeMarketProduct(id) {
    const signer = provider.getSigner();
    const market = new ethers.Contract(Marketaddress, MarketContract.abi, signer);
    const remove_tx = await market.remove(Number(id));
    await remove_tx.wait();
    loadMyProducts();
  }

  async function removeStoreProduct(storeAddress, productId) {
    const signer = provider.getSigner();
    const store = new ethers.Contract(storeAddress, StoreContract.abi, signer);
    const remove_tx = await store.removeProduct(Number(productId));
    await remove_tx.wait();
    loadMyProducts();
  }

  async function loadMyProducts() {
    const signer = provider.getSigner();
    const market = new ethers.Contract(Marketaddress, MarketContract.abi, signer);

    const allProducts = await market.getAllProducts();
    const mySaleProducts = allProducts.filter((p) => p[1] === data.account);
    const myBoughtProducts = allProducts.filter((p) => p[7] === data.account);

    const items = mySaleProducts.map((p) => ({
      productId: Number(p[0]),
      name: p[2],
      image: p[4].replace("ipfs://", IPFS_GATEWAY),
      price: utils.formatUnits(p[5].toString(), "ether"),
      status: productStatus[p[8]],
      store: null,
    }));

    setSaleProducts(items.reverse());

    const factory = new ethers.Contract(factoryAddress, StoreFactoryContract.abi, signer);
    const stores = await factory.getAllStores();
    for (const store of stores) {
      const storeContract = new ethers.Contract(store.storeAddress, StoreContract.abi, signer);
      const products = await storeContract.listStoreProducts();

      products.forEach((p) => {
        if (store.owner === data.account && p[1] !== "") {
          setSaleProducts((prev) => [
            ...prev,
            {
              productId: Number(p[0]),
              name: p[1],
              image: p[3].replace("ipfs://", IPFS_GATEWAY),
              price: utils.formatUnits(p[4].toString(), "ether"),
              status: "IN SALE",
              store: store.storeAddress,
            },
          ]);
        }
      });
    }

    const boughtItems = myBoughtProducts.map((p) => ({
      productId: Number(p[0]),
      name: p[2],
      image: p[4].replace("ipfs://", IPFS_GATEWAY),
      price: utils.formatUnits(p[5].toString(), "ether"),
      status: p[8],
    }));

    setBuyProducts(boughtItems.reverse());
  }

  useEffect(() => {
    loadMyProducts();
  }, [data.account]);

  const currentNetwork = networks["1337"];
  const isGoodNet = data.network === currentNetwork;
  const isConnected = data.account !== "";

  const handleChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <div>
      {isConnected ? (
        isGoodNet ? (
          <Container>
            <TabContext value={currentTab}>
              <div className={classes.Container}>
                <TabList onChange={handleChange}>
                  <Tab label="My Sales" value="sell" />
                  <Tab label="My Buyings" value="buy" />
                </TabList>
              </div>
              <TabPanel value="sell">
                <Container>
                  <Row className="mt-5">
                    {saleProducts.length !== 0 ? (
                      saleProducts.map((product, id) => (
                        <Col md={3} style={{ marginBottom: "40px" }} key={id}>
                          <Card style={{ width: "16rem" }}>
                            <Card.Img variant="top" src={product.image} height="250px" />
                            <Card.Body>
                              <Card.Title style={{ fontSize: "18px" }}>{product.name}</Card.Title>
                              <Card.Text>{product.price} $</Card.Text>

                              <div className="d-flex justify-content-between gap-2 mb-2">
                                <a
                                  className="btn btn-primary"
                                  href={`/products/${product.productId}`}
                                  role="button"
                                >
                                  See More
                                </a>
                              </div>

                              {product.status === "IN SALE" ? (
                                product.store ? (
                                  <button
                                    className="btn btn-danger w-100"
                                    onClick={() =>
                                      removeStoreProduct(product.store, product.productId)
                                    }
                                  >
                                    🗑️ Remove
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-danger w-100"
                                    onClick={() => removeMarketProduct(product.productId)}
                                  >
                                    🗑️ Remove
                                  </button>
                                )
                              ) : product.status === "SOLD" ? (
                                <button className="btn btn-success w-100">Sold</button>
                              ) : null}
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <div className={classes.Container}>
                        <p>You didn't list any product for sale</p>
                      </div>
                    )}
                  </Row>
                </Container>
              </TabPanel>

              <TabPanel value="buy">
                <Container>
                  <Row className="mt-5">
                    {buyProducts.length !== 0 ? (
                      buyProducts.map((product, id) => (
                        <Col md={3} style={{ marginBottom: "40px" }} key={id}>
                          <Card style={{ width: "16rem" }}>
                            <Card.Img variant="top" src={product.image} height="250px" />
                            <Card.Body>
                              <Card.Title style={{ fontSize: "18px" }}>{product.name}</Card.Title>
                              <Card.Text>{product.price} $</Card.Text>

                              <a
                                className="btn btn-primary w-100"
                                href={`/products/${product.productId}`}
                                role="button"
                              >
                                See More
                              </a>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <div className={classes.Container}>
                        <p>You didn't buy any product yet</p>
                      </div>
                    )}
                  </Row>
                </Container>
              </TabPanel>
            </TabContext>
          </Container>
        ) : (
          <div className={classes.Container}>
            You are on the wrong network. Switch to {currentNetwork}.
          </div>
        )
      ) : null}
    </div>
  );
}

export default MyProductsPage;
