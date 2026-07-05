"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Button, message } from "antd";
import { FiMail, FiLock } from "react-icons/fi";
import { supabase } from "@/config/supabase";

export default function SignUpPage() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
		loading: false,
	});

	const handleChange = (field) => (e) => {
		setFormData((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!formData.email || !formData.password) {
			message.error("Email and password are required.");
			return;
		}
		if (formData.password.length < 6) {
			message.error("Password must be at least 6 characters.");
			return;
		}
		if (formData.password !== formData.confirmPassword) {
			message.error("Passwords do not match.");
			return;
		}

		setFormData((prev) => ({ ...prev, loading: true }));

		const { error } = await supabase.auth.signUp({
			email: formData.email,
			password: formData.password,
		});

		setFormData((prev) => ({ ...prev, loading: false }));

		if (error) {
			message.error(error.message);
			return;
		}

		message.success("Account created. Please sign in.");
		router.push("/signin");
	};

	return (
		<div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<div className="flex flex-col gap-1 text-center">
					<h1 className="text-2xl font-semibold text-gray-900">
						Create your account
					</h1>
					<p className="text-sm text-gray-500">
						Start managing your contracts today.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<Input
						size="large"
						prefix={<FiMail className="text-gray-400" />}
						placeholder="Email"
						type="email"
						value={formData.email}
						onChange={handleChange("email")}
					/>
					<Input.Password
						size="large"
						prefix={<FiLock className="text-gray-400" />}
						placeholder="Password"
						value={formData.password}
						onChange={handleChange("password")}
					/>
					<Input.Password
						size="large"
						prefix={<FiLock className="text-gray-400" />}
						placeholder="Confirm password"
						value={formData.confirmPassword}
						onChange={handleChange("confirmPassword")}
					/>
					<Button
						type="primary"
						size="large"
						htmlType="submit"
						loading={formData.loading}
						block
					>
						Sign Up
					</Button>
				</form>

				<p className="text-center text-sm text-gray-500">
					Already have an account?{" "}
					<Link href="/signin" className="font-medium text-blue-600">
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
