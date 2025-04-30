import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers, utils } from "ethers";
import axios from "axios";
import { makeStyles } from "@material-ui/core";
import { useSelector } from "react-redux";
import { Card, Container, Row, Col } from "react-bootstrap";

import { IPFS_GATEWAY } from "./../../utils/ipfsStorage";
import StoreContract from "../../artifacts/contracts/Store.json";
import networks from "../../utils/networksMap.json";

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const useStyles = makeStyles((theme) => ({
  Container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

function StorePage() {
  const { address } = useParams();
  const classes = useStyles();
  const data = useSelector((state) => state.blockchain.value);

  const [allStoresProducts, setAllStoresProducts] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [storeOwner, setStoreOwner] = useState(""); // <--- new state!

  async function loadStoreData() {
    const signer = provider.getSigner();
    const _storeContract = new ethers.Contract(address, StoreContract.abi, signer);

    const storeDetailsURL = await _storeContract.callStatic.storeMetaData();
    const metadataUrl = storeDetailsURL.replace("ipfs://", IPFS_GATEWAY);
    const meta = await axios.get(metadataUrl);
    setStoreName(meta.data.name);

    const ownerAddress = await _storeContract.callStatic.owner(); // <--- get owner properly!
    setStoreOwner(ownerAddress);

    const products = await _storeContract.listStoreProducts();
    const storeInSaleProducts = products.filter((p) => p[1] !== "");

    const items = storeInSaleProducts.map((p) => {
      const imgUrl = p[3].replace("ipfs://", IPFS_GATEWAY);
      return {
        productId: Number(p[0]),
        name: p[1],
        image: imgUrl,
        price: utils.formatUnits(p[4].toString(), "ether"),
      };
    });

    setAllStoresProducts(items.reverse());
  }

  async function removeProduct(productId) {
    try {
      const signer = provider.getSigner();
      const storeContract = new ethers.Contract(address, StoreContract.abi, signer);

      const tx = await storeContract.removeProduct(productId);
      await tx.wait();

      alert("Product removed successfully!");
      loadStoreData();
    } catch (err) {
      console.error(err);
      alert("Failed to remove product: " + err.message);
    }
  }

  const currentNetwork = networks["1337"];
  const isGoodNet = data.network === currentNetwork;
  const isConnected = data.account !== "";

  useEffect(() => {
    loadStoreData();
  }, []);

  return (
    <>
      <div className={classes.Container}>
        {isConnected ? (
          isGoodNet ? (
            <>
              <Container>
                <Row style={{ display: "flex" }}>
                  <h4 className="text-center p-2">{storeName}</h4>
                  <hr />
                </Row>
                {allStoresProducts.length !== 0 ? (
                  <Row className="mt-5">
                    {allStoresProducts.map((product, id) => (
                      <Col style={{ marginBottom: "40px" }} md={3} key={id}>
                        <Card style={{ width: "16rem" }}>
                          <Card.Img variant="top" src={product.image} height="250px" />
                          <Card.Body>
                            <Card.Title style={{ fontSize: "18px" }}>
                              {product.name}
                            </Card.Title>
                            <Card.Text>{product.price} $</Card.Text>

                            <div className="d-flex flex-column gap-2">
                              <a
                                className="btn btn-primary"
                                href={`/store-product/${address}/${product.productId}`}
                                role="button"
                              >
                                See More
                              </a>

                              {/* Listed by you + Remove button */}
                              {data.account &&
                                data.account.toLowerCase() === storeOwner.toLowerCase() && (
                                  <>
                                    <div className="text-muted text-center" style={{ fontSize: "14px" }}>
                                      📦 Listed by you
                                    </div>
                                    <button
                                      className="btn btn-danger"
                                      onClick={() => removeProduct(product.productId)}
                                    >
                                      🗑️ Remove
                                    </button>
                                  </>
                                )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className={classes.Container}>
                    No product listed yet in this store
                  </div>
                )}
              </Container>
            </>
          ) : (
            <div className={classes.Container}>
              You are on the wrong network. Switch to {currentNetwork} network.
            </div>
          )
        ) : null}
      </div>
    </>
  );
}

export default StorePage;
