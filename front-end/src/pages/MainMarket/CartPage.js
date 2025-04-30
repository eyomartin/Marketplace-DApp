
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { ethers, utils } from "ethers";
import MarketContract from "../../artifacts/contracts/Market.json";
import contractsAddress from "../../artifacts/deployments/map.json";
import { IPFS_GATEWAY } from "../../utils/ipfsStorage";

const Marketaddress = contractsAddress["5777"]["Market"][0];
const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

function CartPage() {
  const data = useSelector((state) => state.blockchain.value);
  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!data.account) return;
    const key = `cart_${data.account}`;
    const stored = JSON.parse(localStorage.getItem(key)) || [];
    setCart(stored);
  }, [data.account]);

  const toggleSelect = (productId, price) => {
    let updated;
    if (selectedItems.includes(productId)) {
      updated = selectedItems.filter((id) => id !== productId);
      setTotal(total - parseFloat(price));
    } else {
      updated = [...selectedItems, productId];
      setTotal(total + parseFloat(price));
    }
    setSelectedItems(updated);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((p) => p.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem(`cart_${data.account}`, JSON.stringify(updatedCart));
    setSelectedItems(selectedItems.filter((id) => id !== productId));
  };

  const checkout = async () => {
    if (selectedItems.length === 0) return;
    const signer = provider.getSigner();
    const market = new ethers.Contract(Marketaddress, MarketContract.abi, signer);

    try {
      for (const item of cart) {
        if (selectedItems.includes(item.productId)) {
          const freshPrice = await market.callStatic._convertUSDToETH(
            utils.parseEther(item.price.toString())
          );

          const tx = await market.purchase(item.productId, {
            value: freshPrice,
          });
          await tx.wait();
        }
      }
      alert("Checkout successful!");
      const updatedCart = cart.filter((item) => !selectedItems.includes(item.productId));
      setCart(updatedCart);
      setSelectedItems([]);
      setTotal(0);
      localStorage.setItem(`cart_${data.account}`, JSON.stringify(updatedCart));
    } catch (err) {
      console.error(err);
      alert("Checkout failed: " + err.message);
    }
  };

  return (
    <Container className="mt-4">
      <h3 className="mb-4">Shopping Cart 🛒</h3>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map((product, idx) => (
            <Row key={idx} className="align-items-center mb-4">
              <Col md={8}>
                <Card className="d-flex flex-row">
                  <Card.Img
                    src={product.image.startsWith("ipfs://") ? product.image.replace("ipfs://", IPFS_GATEWAY) : product.image}
                    style={{ width: "120px", height: "120px", objectFit: "cover" }}
                  />
                  <Card.Body>
                    <Card.Title>{product.name}</Card.Title>
                    <Card.Text>{product.price} $</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2} className="text-center">
                <Button variant="danger" onClick={() => removeFromCart(product.productId)}>
                  Remove
                </Button>
              </Col>
              <Col md={2} className="text-center">
                <Form.Check
                  type="checkbox"
                  checked={selectedItems.includes(product.productId)}
                  onChange={() => toggleSelect(product.productId, product.price)}
                />
              </Col>
            </Row>
          ))}
          <Row className="justify-content-end">
            <Col md={4} className="text-end">
              <h5>Total: {total.toFixed(4)} $</h5>
              <Button variant="success" onClick={checkout} disabled={selectedItems.length === 0}>
                Checkout
              </Button>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}

export default CartPage;
