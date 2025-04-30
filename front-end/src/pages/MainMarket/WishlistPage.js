import React, { useEffect, useState } from "react";
import { ethers, utils } from "ethers";
import { useSelector } from "react-redux";
import { Card, Container, Row, Col } from "react-bootstrap";

import MarketContract from "../../artifacts/contracts/Market.json";
import StoreFactoryContract from "../../artifacts/contracts/StoreFactory.json";
import StoreContract from "../../artifacts/contracts/Store.json";
import contractsAddress from "../../artifacts/deployments/map.json";
import { IPFS_GATEWAY } from "../../utils/ipfsStorage";

const Marketaddress = contractsAddress["5777"]["Market"][0];
const factoryAddress = contractsAddress["5777"]["StoreFactory"][0];

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

function WishlistPage() {
  const data = useSelector((state) => state.blockchain.value);
  const [wishlistProducts, setWishlistProducts] = useState([]);

  const wishlistKey = `wishlist_${data.account}`;

  useEffect(() => {
    async function fetchWishlist() {
      const storedWishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
      const signer = provider.getSigner();

      const market = new ethers.Contract(
        Marketaddress,
        MarketContract.abi,
        signer
      );
      const products = await market.getAllProducts();

      const matched = products
        .filter((p) => storedWishlist.includes(Number(p[0])))
        .map((p) => {
          const imgUrl = p[4].replace("ipfs://", IPFS_GATEWAY);
          return {
            productId: Number(p[0]),
            name: p[2],
            image: imgUrl,
            price: utils.formatUnits(p[5].toString(), "ether"),
          };
        });

      // Also fetch products from stores
      const factory = new ethers.Contract(
        factoryAddress,
        StoreFactoryContract.abi,
        signer
      );
      const stores = await factory.getAllStores();
      let storeItems = [];

      await Promise.all(
        stores.map(async (store) => {
          const productStore = new ethers.Contract(
            store.storeAddress,
            StoreContract.abi,
            signer
          );
          const storeProducts = await productStore.listStoreProducts();

          storeProducts.forEach((p) => {
            if (storedWishlist.includes(Number(p[0]))) {
              const imgUrl = p[3].replace("ipfs://", IPFS_GATEWAY);
              storeItems.push({
                store: store.storeAddress,
                productId: Number(p[0]),
                name: p[1],
                image: imgUrl,
                price: utils.formatUnits(p[4].toString(), "ether"),
              });
            }
          });
        })
      );

      setWishlistProducts(matched.concat(storeItems));
    }

    fetchWishlist();
  }, [data.account]);

  const removeFromWishlist = (productId) => {
    const storedWishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    const updated = storedWishlist.filter((id) => id !== productId);
    localStorage.setItem(wishlistKey, JSON.stringify(updated));
    setWishlistProducts((prev) =>
      prev.filter((item) => item.productId !== productId)
    );
  };
  return (
    <Container>
      <h2 className="text-center my-4">My Wishlist</h2>
      <Row>
        {wishlistProducts.length === 0 ? (
          <p className="text-center">No products in wishlist</p>
        ) : (
          wishlistProducts.map((product, id) => (
            <Col md={3} key={id} style={{ marginBottom: "20px" }}>
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
                      href={
                        product.store
                          ? `/store-product/${product.store}/${product.productId}`
                          : `/products/${product.productId}`
                      }
                      role="button"
                    >
                      See More
                    </a>
                    <button
                      className="btn btn-danger"
                      onClick={() => removeFromWishlist(product.productId)}
                    >
                      Remove from Wishlist
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
}

export default WishlistPage;
