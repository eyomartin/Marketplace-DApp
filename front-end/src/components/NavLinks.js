// ✅ Step 1: Add Cart Button with Counter to NavLinks.js

import { Navbar, Container, Nav, NavDropdown, Badge } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.css';
import Account from "./Account";
import logo from '../dapp-logo.png';
import { useState, useEffect } from "react";

function NavLinks() {
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const account = localStorage.getItem("persist:root") ? JSON.parse(JSON.parse(localStorage.getItem("persist:root")).blockchain).value.account : null;
        if (account) {
          const key = `cart_${account}`;
          const cart = JSON.parse(localStorage.getItem(key)) || [];
          setCartCount(cart.length);
        }
      }, []);
      

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand href="/">
                        <img src={logo} width="100px" />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="navbarScroll" />
                    <Navbar.Collapse id="navbarScroll">
                        <Nav activeKey={window.location.pathname}
                            className="me-auto"
                            style={{ maxHeight: '100px' }}
                            navbarScroll>
                            <Nav.Link href="/">Home</Nav.Link>
                            <Nav.Link href="/my-products">My Products</Nav.Link>
                            <Nav.Link href="/my-store">Store</Nav.Link>
                            <Nav.Link href="/wishlist">Wishlist</Nav.Link>
                            <Nav.Link href="/cart">
                                🛒 Cart{' '}
                                <Badge pill bg="success">{cartCount}</Badge>
                            </Nav.Link>
                            <NavDropdown
                                id="nav-dropdown-dark-example"
                                title="Add"
                                menuVariant="dark"
                            >
                                <NavDropdown.Item href="/add-product">Product</NavDropdown.Item>
                                <NavDropdown.Item href="/create-auction">Auction</NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                        <Account />
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    );
}

export default NavLinks;
