import qpaLogo from '../assets/logo/qpa-logo.png';

export default function Logo() {
  return (
    <div className="flex justify-center mb-6">
      <img src={qpaLogo} alt="QPAlliance" className="h-12 w-auto" />
    </div>
  );
}
