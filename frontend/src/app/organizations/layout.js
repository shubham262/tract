import DashboardLayout from "@/layouts/DashboardLayout";

export default function OrganizationsLayout({ children }) {
	return <DashboardLayout requireOrg={false}>{children}</DashboardLayout>;
}
