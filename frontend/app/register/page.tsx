import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gray-100
      "
    >
      <div
        className="
          bg-white
          p-8
          rounded-xl
          shadow-lg
          w-full
          max-w-md
        "
      >
        <h1 className="text-3xl font-bold mb-6 text-center">
          Register
        </h1>

        <div className="space-y-4">

          <AuthInput
            type="text"
            placeholder="Enter Name"
          />

          <AuthInput
            type="email"
            placeholder="Enter Email"
          />

          <AuthInput
            type="password"
            placeholder="Enter Password"
          />

          <AuthInput
            type="password"
            placeholder="Confirm Password"
          />

          <AuthButton text="Register" />
        </div>

        <p className="text-center mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-semibold"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}