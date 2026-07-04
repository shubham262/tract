"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Input, Button, message } from "antd";
import { FiMail, FiLock } from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";
import { updateUserInfo } from "@/redux/authSlice";

export default function SignInPage() {
	const router = useRouter();
	const dispatch = useDispatch();
	const [formData, setFormData] = useState({ email: "", password: "", loading: false });

	const handleChange = (field) => (e) => {
		setFormData((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!formData.email || !formData.password) {
			message.error("Email and password are required.");
			return;
		}

		setFormData((prev) => ({ ...prev, loading: true }));

		const { data, error } = await supabase.auth.signInWithPassword({
			email: formData.email,
			password: formData.password,
		});

		setFormData((prev) => ({ ...prev, loading: false }));

		if (error) {
			message.error(error.message);
			return;
		}

		dispatch(updateUserInfo(data.user));

		message.success("Signed in.");
		router.push("/organizations");
	};

	return (
		<div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<div className="flex flex-col gap-1 text-center">
					<h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
					<p className="text-sm text-gray-500">Sign in to your account.</p>
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
					<Button type="primary" size="large" htmlType="submit" loading={formData.loading} block>
						Sign In
					</Button>
				</form>

				<p className="text-center text-sm text-gray-500">
					Don&apos;t have an account?{" "}
					<Link href="/signup" className="font-medium text-blue-600">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
