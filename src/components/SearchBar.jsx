import { Search } from "lucide-react";
import { useState } from "react";

export default function SearchBar({ initial = "", onSearch, autoFocus = false, placeholder = "Search shoes..." }) {
  const [value, setValue] = useState(initial);
  const submit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };
  return (
    <form className="searchbar" role="search" onSubmit={submit}>
      <input type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} aria-label="Search products" autoFocus={autoFocus} maxLength={80} />
      <button type="submit" aria-label="Search">
        <Search size={18} />
      </button>
    </form>
  );
}
