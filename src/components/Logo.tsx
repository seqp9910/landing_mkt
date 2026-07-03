import qpaLogo from '../assets/logo/qpa-logo-square.png';

export default function Logo() {
  return (
    <div className="flex justify-center mb-6">
      <img src={qpaLogo} alt="QPAlliance" className="h-14 w-auto" />
    </div>
  );
}
