import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./page/Home";
import Validator from "./page/Validator";
import BankCodes from "./page/BankCodes";
import Matcher from "./page/Matcher";

function App() {
    return (
        <Router>
            <div className="flex flex-col min-h-screen bg-white transition-colors duration-300">
                <Navbar />
                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/validator" element={<Validator />} />
                        <Route path="/bank-codes" element={<BankCodes />} />
                        <Route path="/matcher" element={<Matcher />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
