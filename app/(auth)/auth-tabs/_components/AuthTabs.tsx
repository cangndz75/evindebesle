"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import LoginForm from "@/app/(public)/_components/LoginForm";
import RegisterForm from "@/app/(public)/_components/RegisterForm";

export default function AuthTabs() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-lime-100 px-2">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 sm:p-10 relative">
        {/* Tablar */}
        <div className="flex mb-8 gap-2 rounded-lg bg-gray-100">
          <button
            className={`flex-1 py-3 rounded-lg text-base font-semibold transition ${
              tab === "login"
                ? "bg-white shadow text-lime-700"
                : "text-gray-400 hover:text-lime-600"
            }`}
            onClick={() => setTab("login")}
            type="button"
          >
            Giriş Yap
          </button>
          <button
            className={`flex-1 py-3 rounded-lg text-base font-semibold transition ${
              tab === "register"
                ? "bg-white shadow text-lime-700"
                : "text-gray-400 hover:text-lime-600"
            }`}
            onClick={() => setTab("register")}
            type="button"
          >
            Üye Ol
          </button>
        </div>
        <AnimatePresence mode="wait">
          {tab === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.18 }}
            >
              <LoginForm />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.18 }}
            >
              <RegisterForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
