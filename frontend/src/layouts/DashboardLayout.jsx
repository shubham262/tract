"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { supabase } from "@/config/supabase";
import AppHeader from "@/components/AppHeader";

const DashboardLayout = ({ children, requireOrg = true }) => {
	const router = useRouter();
	const currentOrgId =
		useSelector((state) => state.org.currentOrgId) ||
		window.localStorage.getItem("tract:currentOrgId");
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (!session) return router.replace("/signin");
			if (requireOrg && !currentOrgId) return router.replace("/organizations");
			setChecking(false);
		});
	}, [currentOrgId, requireOrg, router]);

	return (
		<div className="flex flex-1 flex-col bg-white">
			<AppHeader />
			<div className="flex flex-1 flex-col items-center px-6 py-12">
				{checking ? (
					<p className="text-sm text-gray-500">Loading…</p>
				) : (
					children
				)}
			</div>
		</div>
	);
};

export default DashboardLayout;
