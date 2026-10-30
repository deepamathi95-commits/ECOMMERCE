const LOGOS = [
  ["visa.png", "Visa"], ["mastercard.png", "Mastercard"], ["rupay.png", "RuPay"],
  ["paypal.png", "PayPal"], ["clearpay.png", "Clearpay"], ["klarna.png", "Klarna"],
];

/** Decorative brand logos from the design assets. Checkout currently offers Cash on Delivery and a simulated payment only. */
export default function PaymentLogos() {
  return (
    <div className="pay-logos" aria-label="Payment brands shown for illustration">
      {LOGOS.map(([file, name]) => (
        <img key={file} src={`/images/payments/${file}`} alt={name} loading="lazy" />
      ))}
    </div>
  );
}
