import { Footprints } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="StepUp home">
      <span className="logo__mark"><Footprints size={20} /></span>
      <span>Step<em>Up</em></span>
    </Link>
  );
}
