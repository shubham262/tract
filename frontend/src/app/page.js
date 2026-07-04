"use client";

import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { Button, message } from "antd";
import { FiFileText, FiArrowRight, FiLogOut } from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";
import { updateUserInfo } from "@/redux/authSlice";

export default function Home() {
	const dispatch = useDispatch();
	const userInfo = useSelector((state) => state.auth.userInfo);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		dispatch(updateUserInfo(null));
		message.success("Signed out.");
	};

	return (
		<div className="flex flex-col flex-1 bg-white">
			<header className="flex items-center justify-between px-6 py-4 sm:px-12">
				<div className="flex items-center gap-2">
					<FiFileText className="text-xl text-blue-600" />
					<span className="text-lg font-semibold text-gray-900">Tract</span>
				</div>
				<div className="flex items-center gap-3">
					{userInfo ? (
						<>
							<span className="hidden text-sm text-gray-500 sm:inline">{userInfo.email}</span>
							<Button icon={<FiLogOut />} onClick={handleSignOut}>
								Sign Out
							</Button>
						</>
					) : (
						<>
							<Link href="/signin">
								<Button>Sign In</Button>
							</Link>
							<Link href="/signup">
								<Button type="primary">Sign Up</Button>
							</Link>
						</>
					)}
				</div>
			</header>

			<main className="flex flex-1 flex-col items-center justify-center px-6 text-center sm:px-12">
				<div className="flex max-w-2xl flex-col items-center gap-6">
					<h1 className="text-3xl font-bold text-gray-900 sm:text-5xl">
						Contract Operations, streamlined.
					</h1>
					<p className="text-base text-gray-600 sm:text-lg">
						Create, track, and manage contracts across your organization from a single console.
					</p>
					<div className="flex flex-col gap-3 sm:flex-row">
						{userInfo ? (
							<Link href="/organizations">
								<Button type="primary" size="large" icon={<FiArrowRight />} iconPlacement="end">
									Go to your organizations
								</Button>
							</Link>
						) : (
							<>
								<Link href="/signup">
									<Button type="primary" size="large" icon={<FiArrowRight />} iconPlacement="end">
										Get Started
									</Button>
								</Link>
								<Link href="/signin">
									<Button size="large">Sign In</Button>
								</Link>
							</>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
