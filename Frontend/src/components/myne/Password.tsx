import React, { useState } from 'react';
import { Eye, EyeClosed, EyeOff } from 'lucide-react'; // Importez les icônes Lucide

interface PasswordInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  // Vous pouvez ajouter d'autres props comme 'className' si besoin
  className?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  className
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };
return(
    <div className="relative border h-10 flex flex-grow"> {/* Conteneur pour positionner l'icône */}
      <input
        type={showPassword ? 'text' : 'password'} // Le type change ici !
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        // Applique les classes Tailwind pour le style de l'input,
        // et ajoute un padding à droite pour faire de la place à l'icône
        className={`${className || ''}`} // Permet de passer des classes supplémentaires
      />
      <button
        type="button" // Important pour ne pas soumettre le formulaire
        onClick={togglePasswordVisibility}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {showPassword ? (
            <Eye size={20} /> // Icône "œil" si le mot de passe est masqué
        ) : (
            <EyeClosed size={20}/>
        )}
      </button>
    </div>
  )
}
export default PasswordInput