import Link from "next/link";
import { Button } from "antd";
import { FiFileText, FiArrowRight } from "react-icons/fi";

export default function Home() {
	return (
		<div className="flex flex-col flex-1 bg-white">
			<header className="flex items-center justify-between px-6 py-4 sm:px-12">
				<div className="flex items-center gap-2">
					<FiFileText className="text-xl text-blue-600" />
					<span className="text-lg font-semibold text-gray-900">Tract</span>
				</div>
				<div className="flex items-center gap-3">
					<Link href="/signin">
						<Button>Sign In</Button>
					</Link>
					<Link href="/signup">
						<Button type="primary">Sign Up</Button>
					</Link>
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
						<Link href="/signup">
							<Button type="primary" size="large" icon={<FiArrowRight />} iconPlacement="end">
								Get Started
							</Button>
						</Link>
						<Link href="/signin">
							<Button size="large">Sign In</Button>
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
