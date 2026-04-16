import { useNavigate } from "react-router-dom";

function BackButton({ label = "Back" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-studio-primary dark:text-gray-300"
    >
      <span aria-hidden="true">&larr;</span>
      <span>{label}</span>
    </button>
  );
}

export default BackButton;
