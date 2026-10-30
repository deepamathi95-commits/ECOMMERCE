import { ChevronDown, LogOut, Menu, Package, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { productService } from "../services";
import { formatPrice } from "../utils/format";
import Logo from "./Logo";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, rules } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const accountRef = useRef(null);
  const catRef = useRef(null);

  useEffect(() => {
    productService.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setMenuOpen(false); setSearchOpen(false); setCatOpen(false); setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const close = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const onSearch = (q) => {
    setSearchOpen(false);
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <>
      <div className="topbar">Free shipping on orders over {formatPrice(rules.free_shipping_threshold)} · Cash on Delivery available</div>
      <header className="header">
        <div className="container header__inner">
          <button type="button" className="icon-btn menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
          <Logo />
          <nav className={`nav ${menuOpen ? "open" : ""}`} aria-label="Main">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/shop" end>Shop</NavLink>
            <div ref={catRef} style={{ position: "relative" }}>
              <button type="button" className="nav__link" aria-expanded={catOpen} onClick={() => setCatOpen((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", fontFamily: "inherit" }}>
                Categories <ChevronDown size={14} />
              </button>
              {catOpen && (
                <div className="account-menu__panel" style={{ left: 0, right: "auto" }}>
                  {["men", "women", "kids"].map((a) => (
                    <Link key={a} to={`/shop?audience=${a}`}>{a[0].toUpperCase() + a.slice(1)}</Link>
                  ))}
                  <div className="account-menu__who" style={{ borderTop: "1px solid var(--color-border)", borderBottom: 0, marginTop: 4 }}>By type</div>
                  {categories.map((c) => (
                    <Link key={c.slug} to={`/shop?category=${c.slug}`}>{c.name}</Link>
                  ))}
                </div>
              )}
            </div>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <div className="header__actions">
            <button type="button" className="icon-btn" aria-label="Search" aria-expanded={searchOpen} onClick={() => setSearchOpen((v) => !v)}>
              <Search size={21} />
            </button>
            <div className="account-menu" ref={accountRef}>
              {isAuthenticated ? (
                <>
                  <button type="button" className="icon-btn" aria-label="Account menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((v) => !v)}>
                    <User size={21} />
                  </button>
                  {accountOpen && (
                    <div className="account-menu__panel">
                      <div className="account-menu__who">Signed in as<br />{user.email}</div>
                      <Link to="/profile"><User size={16} style={{ marginRight: 8 }} />My profile</Link>
                      <Link to="/orders"><Package size={16} style={{ marginRight: 8 }} />My orders</Link>
                      <button type="button" onClick={async () => { await logout(); navigate("/"); }}>
                        <LogOut size={16} style={{ marginRight: 8 }} />Log out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/login" className="icon-btn" aria-label="Log in or register"><User size={21} /></Link>
              )}
            </div>
            <Link to="/cart" className="icon-btn" aria-label={`Shopping cart, ${itemCount} items`}>
              <ShoppingBag size={21} />
              {itemCount > 0 && <span className="badge-count">{itemCount}</span>}
            </Link>
          </div>
        </div>
        {searchOpen && (
          <div className="search-drawer">
            <div className="container"><SearchBar onSearch={onSearch} autoFocus /></div>
          </div>
        )}
      </header>
    </>
  );
}
