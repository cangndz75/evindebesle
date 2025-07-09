import RegisterForm from '@/app/(public)/_components/RegisterForm';
import AuthImage from '@/app/(public)/_components/AuthImage';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-background px-4 py-16">
      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <RegisterForm />
      </div>
      <AuthImage />
    </div>
  );
}
