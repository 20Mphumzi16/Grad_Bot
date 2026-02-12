import { useEffect } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { validatePasswordComplexity } from "../../utils/passwordValidation";

interface PasswordStrengthProps {
  password: string;
  onValidationChange: (isValid: boolean) => void;
}

export function PasswordStrength({ password, onValidationChange }: PasswordStrengthProps) {
  const { requirements, isValid } = validatePasswordComplexity(password);

  const validCount = requirements.filter((r) => r.valid).length;

  useEffect(() => {
    onValidationChange(isValid);
  }, [isValid, onValidationChange]);

  const strengthLabel = 
    validCount <= 2 ? "Weak" : 
    validCount < 5 ? "Medium" : "Strong";

  const strengthColor = 
    validCount <= 2 ? "text-red-500" : 
    validCount < 5 ? "text-yellow-500" : "text-green-500";
    
  const barColor = 
    validCount <= 2 ? "bg-red-500" : 
    validCount < 5 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${(validCount / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className={`text-xs font-semibold ${strengthColor}`}>
            {password.length > 0 ? strengthLabel : ""}
        </span>
      </div>

      {/* Requirements List */}
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2 text-xs transition-colors duration-200">
            {req.valid ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
            )}
            <span className={req.valid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
