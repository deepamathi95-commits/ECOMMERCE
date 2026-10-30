import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import PaymentLogos from "./PaymentLogos";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Logo />
            <p>Shoes for every step. From everyday sneakers to statement heels, find a pair you'll love for the whole family.</p>
            <div className="footer__social">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={18} /></a>
            </div>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/shop?audience=men">Men</Link>
            <Link to="/shop?audience=women">Women</Link>
            <Link to="/shop?audience=kids">Kids</Link>
            <Link to="/shop?category=sneakers">Sneakers</Link>
            <Link to="/shop?category=boots">Boots</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/orders">My orders</Link>
            <Link to="/profile">My account</Link>
            <Link to="/cart">Cart</Link>
          </div>
          <div className="footer__contact">
            <h4>Get in touch</h4>
            <div><MapPin size={16} /> 24 Market Street, Your City</div>
            <div><Phone size={16} /> +1 (555) 010-2030</div>
            <div><Mail size={16} /> hello@stepup.example</div>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} StepUp. All rights reserved.</span>
          <PaymentLogos />
        </div>
      </div>
    </footer>
  );
}
