export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h2>Kalkulator Rezyliencji FNP</h2>
          <p style={{ marginTop: 8 }}>
            Współpraca Fundacji Nowe Przestrzenie i Pawła Mamcarza, eksperta Fundacji i współtwórcy kalkulatora.
            Silnik obliczeniowy: Silence Tax (MIT).
          </p>
        </div>
        <div>
          <h2>Kontakt</h2>
          <p style={{ marginTop: 8 }}><a href="mailto:zapraszamy@noweprzestrzenie.pl">zapraszamy@noweprzestrzenie.pl</a></p>
          <p className="muted" style={{ marginTop: 4 }}>Metodologia: <a href="mailto:pawel@mamcarz.com">pawel@mamcarz.com</a></p>
          <p className="muted num" style={{ marginTop: 4 }}>ORCID 0009-0002-3274-4226</p>
        </div>
        <div>
          <h2>Silnik</h2>
          <p style={{ marginTop: 8 }}><a href="https://github.com/pawelmamcarz/kalkulator-rezyliencji-fnp">Kod kalkulatora i założenia</a></p>
          <p className="muted" style={{ marginTop: 4 }}>Obliczenia w przeglądarce, licencja MIT.</p>
        </div>
      </div>
      <div className="footer-line">
        <span>Fundacja Nowe Przestrzenie × Paweł Mamcarz · silnik: Silence Tax</span>
        <span className="num">wersja beta {__APP_VERSION__}</span>
      </div>
    </footer>
  );
}
