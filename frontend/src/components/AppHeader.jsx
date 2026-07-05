"use client";

import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Select, Button, message } from "antd";
import { FiFileText, FiLogOut } from "react-icons/fi";
import { supabase } from "@/config/supabase";
import { updateUserInfo } from "@/redux/authSlice";
import { setCurrentOrgId } from "@/redux/orgSlice";

const CURRENT_ORG_STORAGE_KEY = "tract:currentOrgId";

export default function AppHeader() {
	const router = useRouter();
	const dispatch = useDispatch();
	const userInfo = useSelector((state) => state.auth.userInfo);
	const { organizations, currentOrgId } = useSelector((state) => state.org);

	const handleOrgChange = (orgId) => {
		dispatch(setCurrentOrgId(orgId));
		window.localStorage.setItem(CURRENT_ORG_STORAGE_KEY, orgId);
	};

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		dispatch(updateUserInfo(null));
		message.success("Signed out.");
		router.push("/signin");
	};

	return (
		<header className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sm:px-12">
			<div className="flex items-center gap-2">
				<FiFileText className="text-xl text-blue-600" />
				<span className="text-lg font-semibold text-gray-900">Tract</span>
			</div>
			<div className="flex items-center gap-3">
				{organizations.length > 0 && (
					<Select
						value={currentOrgId || undefined}
						onChange={handleOrgChange}
						placeholder="Select organization"
						className="w-48"
						options={organizations.map((org) => ({ value: org.id, label: org.name }))}
					/>
				)}
				<span className="hidden text-sm text-gray-500 sm:inline">{userInfo?.email}</span>
				<Button icon={<FiLogOut />} onClick={handleSignOut}>
					Sign Out
				</Button>
			</div>
		</header>
	);
}
