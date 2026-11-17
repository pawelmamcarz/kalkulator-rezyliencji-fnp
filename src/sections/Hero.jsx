export default function Hero({ survey = false }) {
  return (
    <div className="b-intro">
      <h1>Ile może kosztować milczenie w Twojej firmie?</h1>
      <p className="muted">Projekt badawczy Fundacji Nowe Przestrzenie. Zapraszamy do udziału. <a href="mailto:zapraszamy@noweprzestrzenie.pl?subject=Projekt%20badawczy%20kalkulatora">Zgłoś zainteresowanie pilotażem</a>.</p>
      <p className="lead">{survey ? "Wprowadź wynik badania na zgodnej skali i zobacz scenariusz rocznych kosztów." : "Wybierz zdanie, które brzmi jak Twoja firma, i zobacz, ile to może kosztować rocznie."}</p>
    </div>
  );
}
