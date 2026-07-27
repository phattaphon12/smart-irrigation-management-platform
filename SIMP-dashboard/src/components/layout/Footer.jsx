import { FOOTER_LOGOS } from '../../constants/footerLogos';

export default function Footer() {
  return (
    <footer className="app-footer">
      {/* <div className="footer-logos">
        {FOOTER_LOGOS.map((logo, i) => (
          <div className="footer-logo-slot" key={i}>
            {logo.src ? <img src={logo.src} alt={logo.alt} /> : <span>{logo.alt}</span>}
          </div>
        ))}
      </div> */}
      <div className="footer-credit">
        <div className="footer-credit-title">Organized by</div>
        <div className="footer-credit-org">School of Engineering, King Mongkut's Institute of Technology Ladkrabang (KMITL)</div>
      </div>
    </footer>
  );
}
