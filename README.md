# 🛍️ Marketplace DApp – Full-Stack Decentralized E-commerce Application

This is a full-stack decentralized e-commerce platform built using **Solidity**, **React.js**, **Ethers.js**, and **IPFS**. It allows users to create stores, list products, browse listings, and complete purchases using **MetaMask** on the Ethereum blockchain.

---

## 🚀 Key Features Implemented

### ✅ Core Functionality
- Create decentralized **stores** and list **products**
- Product metadata and images are stored on **IPFS**
- Purchases handled securely via **MetaMask** interactions
- Dynamic price conversion from USD to ETH

### ✅ Newly Added Features
- 🛒 **Shopping Cart System** with live item counter and multi-product checkout
- ⭐ **Wishlist**: Save and remove favorite products from a separate page
- 🔍 **Search Bar**: Live filtering of products by name on the Home page
- 🌟 **5-Star Feedback System**: Buyers can rate products after receiving them
- 💸 **Tip the Seller**: Send optional ETH-based tips after a successful purchase

---

## 🧠 Technologies Used

- **Solidity** – Smart Contracts (Marketplace.sol, Store.sol)
- **Brownie** – Python-based smart contract framework
- **React.js** – Frontend development
- **Ethers.js** – Blockchain interaction
- **IPFS** – Decentralized file storage via `web3.storage`
- **Redux** – App-wide state management
- **MetaMask** – Web3 wallet authentication

---

## 📷 Screenshots

## 📋 Wishlist Page Feature

Here is how the Wishlist page looks in the application:

![Wishlist Page](https://github.com/eyomartin/Marketplace-DApp/blob/main/screenshots/WishlistPage.png?raw=true)


---

## 📦 How to Run the Project Locally

### Prerequisites
- Node.js & npm
- Python 3
- [Ganache GUI](https://trufflesuite.com/ganache/) (for local blockchain)
- MetaMask extension

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/eyomartin/Marketplace-DApp.git
   cd Marketplace-DApp
Install Python dependencies:

bash
Copy
Edit
pip install -r requirements.txt
Install front-end dependencies:

bash
Copy
Edit
cd front-end
yarn install
Start Ganache and create a workspace with the included accounts.

Deploy smart contracts to local blockchain:

bash
Copy
Edit
brownie run scripts/deploy.py --network ganache-gui
brownie run scripts/update_front_end.py
Start the front-end:

bash
Copy
Edit
cd front-end
yarn start
