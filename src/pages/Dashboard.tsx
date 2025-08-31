import { useQuery } from "@tanstack/react-query";
import {
	colorSchemeDarkBlue,
	themeBalham,
	type ColDef,
	type FilterChangedEvent,
	type GridApi,
	type GridReadyEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	TimeScale,
	Tooltip,
} from "chart.js";
import {
	Activity,
	Calendar,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	DollarSign,
	Filter,
	LogOut,
	PieChart,
	Search,
	TrendingDown,
	TrendingUp,
	XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { useAuth } from "../contexts/AuthContext";
import { BASE_URL, useApi } from "../utils/api";

ChartJS.register(
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement,
	TimeScale
);

interface Transaction {
	id: number;
	userEmail: string;
	amount: number;
	accountNumber: string;
	txnMethod: string;
	txnMode: string;
	txnType: "debit" | "credit";
	txnRef: string;
	counterParty: string;
	txnInfo: string;
	txnDatetime: string;
	createdTime: string;
}

interface DashboardStats {
	totalCredit: number;
	totalDebit: number;
	netBalance: number;
	totalTransactions: number;
	avgTransactionAmount: number;
	topCounterParties: Array<{ name: string; amount: number; count: number }>;
	topCreditCounterParties: Array<{
		name: string;
		amount: number;
		count: number;
		type: "credit";
	}>;
	topDebitCounterParties: Array<{
		name: string;
		amount: number;
		count: number;
		type: "debit";
	}>;
	monthlyTrends: Array<{ month: string; credit: number; debit: number }>;
	transactionsByMethod: Array<{ method: string; count: number }>;
}

const Dashboard: React.FC = () => {
	const [dateFilter, setDateFilter] = useState<"monthly" | "7d" | "custom">(
		"monthly"
	);
	const [selectedTab, setSelectedTab] = useState<
		"overview" | "transactions" | "analytics"
	>("overview");
	const [currentMonth, setCurrentMonth] = useState<{
		year: number;
		month: number;
	}>(() => {
		const now = new Date();
		return { year: now.getFullYear(), month: now.getMonth() + 1 };
	});
	const [customDateRange, setCustomDateRange] = useState<{
		from: string;
		to: string;
	}>({
		from: "",
		to: "",
	});
	const [lastMonth, _] = useState<{ year: number; month: number }>(() => {
		const now = new Date();
		let year = now.getFullYear();
		let month = now.getMonth(); // Previous month
		if (month === 0) {
			month = 12;
			year -= 1;
		}
		return { year, month };
	});

	useEffect(() => {
		console.log("in dashboard");
	}, []);

	const ipaddr = BASE_URL;
	const { fetchWithToken } = useApi();
	const { user } = useAuth();
	const username = user?.username.replace("+", " ");

	const greenbg = "#10b981";
	const redbg = "#ef4444";

	// Build API URL based on filter
	const buildApiUrl = () => {
		const baseUrl = `${ipaddr}/txns/${user?.email}`;

		switch (dateFilter) {
			case "monthly":
				return `${baseUrl}/month/${currentMonth.year}/${String(
					currentMonth.month
				).padStart(2, "0")}`;
			case "7d":
				return `${baseUrl}/7d`;
			case "custom":
				if (customDateRange.from && customDateRange.to) {
					return `${baseUrl}?from=${customDateRange.from}&to=${customDateRange.to}`;
				}
				return baseUrl;
			default:
				return baseUrl;
		}
	};

	// Navigation functions
	const navigateMonth = (direction: "prev" | "next") => {
		setCurrentMonth(prev => {
			const newMonth = direction === "next" ? prev.month + 1 : prev.month - 1;
			if (newMonth > 12) {
				return { year: prev.year + 1, month: 1 };
			} else if (newMonth < 1) {
				return { year: prev.year - 1, month: 12 };
			}
			return { ...prev, month: newMonth };
		});
	};

	const getMonthName = () => {
		const date = new Date(currentMonth.year, currentMonth.month - 1);
		return date.toLocaleString("default", { month: "long", year: "numeric" });
	};

	// Fetch transactions data
	const {
		data: transactions = [],
		isLoading,
		error,
	} = useQuery<Transaction[]>({
		queryKey: ["transactions", currentMonth],
		queryFn: async () => {
			const url = buildApiUrl();
			console.log("Fetching from:", url);
			const res = await fetchWithToken(url);
			if (!res.ok) throw new Error("Failed to fetch transactions");
			const data = await res.json();
			console.log("Fetched data:", data);
			return data;
		},
		// refetchInterval: 30000, // Refresh every 30 seconds
	});

	const themeDarkBlue = themeBalham.withPart(colorSchemeDarkBlue);
	// const [allTransactions, setAllTransactions] = useState([]); // Your original data

	// No need for client-side filtering since backend handles it
	const filteredTransactions = transactions;
	const { logout } = useAuth();
	const [gridApi, setGridApi] = useState<GridApi | null>(null);
	const [totalAmount, setTotalAmount] = useState<number>(0);

	const calculateVisibleTotal = (api: GridApi): number => {
		if (!api) return 0;

		let total = 0;
		api.forEachNodeAfterFilter(node => {
			if (node.data) {
				total +=
					node.data.txnType === "credit" ? node.data.amount : -node.data.amount;
			}
		});
		return total;
	};

	// Update total when grid filtering changes
	const onFilterChanged = useCallback((params: FilterChangedEvent): void => {
		const newTotal = calculateVisibleTotal(params.api);
		setTotalAmount(newTotal);
	}, []);

	// Calculate dashboard statistics
	const stats: DashboardStats | null = useMemo(() => {
		if (!transactions) return null;
		const credits = filteredTransactions.filter(t => t.txnType === "credit");
		const debits = filteredTransactions.filter(t => t.txnType === "debit");

		const totalCredit = credits.reduce((sum, t) => sum + t.amount, 0);
		const totalDebit = debits.reduce((sum, t) => sum + t.amount, 0);

		// Top counter parties for credits
		const creditCounterPartyMap = new Map<
			string,
			{ amount: number; count: number }
		>();
		credits.forEach(txn => {
			const existing = creditCounterPartyMap.get(txn.counterParty) || {
				amount: 0,
				count: 0,
			};
			creditCounterPartyMap.set(txn.counterParty, {
				amount: existing.amount + txn.amount,
				count: existing.count + 1,
			});
		});

		// Top counter parties for debits
		const debitCounterPartyMap = new Map<
			string,
			{ amount: number; count: number }
		>();
		debits.forEach(txn => {
			const existing = debitCounterPartyMap.get(txn.counterParty) || {
				amount: 0,
				count: 0,
			};
			debitCounterPartyMap.set(txn.counterParty, {
				amount: existing.amount + txn.amount,
				count: existing.count + 1,
			});
		});

		const topCreditCounterParties = Array.from(creditCounterPartyMap.entries())
			.map(([name, data]) => ({ name, ...data, type: "credit" as const }))
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 10);

		const topDebitCounterParties = Array.from(debitCounterPartyMap.entries())
			.map(([name, data]) => ({ name, ...data, type: "debit" as const }))
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 10);

		// Combined top counter parties (for backward compatibility)
		const counterPartyMap = new Map<
			string,
			{ amount: number; count: number }
		>();
		filteredTransactions.forEach(txn => {
			const existing = counterPartyMap.get(txn.counterParty) || {
				amount: 0,
				count: 0,
			};
			counterPartyMap.set(txn.counterParty, {
				amount: existing.amount + txn.amount,
				count: existing.count + 1,
			});
		});

		const topCounterParties = Array.from(counterPartyMap.entries())
			.map(([name, data]) => ({ name, ...data }))
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 10);

		// Daily trends instead of monthly for better granularity
		const dailyMap = new Map<string, { credit: number; debit: number }>();
		filteredTransactions.forEach(txn => {
			const fullDate = new Date(txn.txnDatetime).toISOString().split("T")[0]; // YYYY-MM-DD format
			const existing = dailyMap.get(fullDate) || { credit: 0, debit: 0 };
			if (txn.txnType === "credit") {
				existing.credit += txn.amount;
			} else {
				existing.debit += txn.amount;
			}
			dailyMap.set(fullDate, existing);
		});

		const monthlyTrends = Array.from(dailyMap.entries())
			.sort(([dateA], [dateB]) => dateA.localeCompare(dateB)) // Sort by YYYY-MM-DD string
			.map(([fullDate, data]) => ({
				month: new Date(fullDate).toLocaleDateString("en-IN", {
					day: "2-digit",
					month: "short",
				}),
				...data,
			}));

		// Transactions by method
		const methodMap = new Map<string, number>();
		filteredTransactions.forEach(txn => {
			methodMap.set(txn.txnMethod, (methodMap.get(txn.txnMethod) || 0) + 1);
		});

		const transactionsByMethod = Array.from(methodMap.entries()).map(
			([method, count]) => ({ method, count })
		);

		return {
			totalCredit,
			totalDebit,
			netBalance: totalCredit - totalDebit,
			totalTransactions: filteredTransactions.length,
			avgTransactionAmount:
				filteredTransactions.length > 0
					? (totalCredit + totalDebit) / filteredTransactions.length
					: 0,
			topCounterParties,
			topCreditCounterParties,
			topDebitCounterParties,
			monthlyTrends,
			transactionsByMethod,
		};
	}, [filteredTransactions]);

	const pinnedBottomData = useMemo(
		() => [
			{
				txnType: "",
				amount: totalAmount,
				counterParty: "TOTAL",
				txnDatetime: "",
				txnMethod: "",
				txnRef: "",
			},
		],
		[totalAmount]
	);

	// AG Grid column definitions
	const columnDefs: ColDef[] = [
		{
			headerName: "Type",
			field: "txnType",
			width: 80,

			cellRenderer: (params: any) => {
				if (params.node.rowPinned)
					return <span className='font-bold text-primary'>TOTAL</span>;
				return (
					<span
						className={`badge badge-sm  font-bold ${
							params.value === "credit"
								? "badge-success text-green-100 bg-green-500/20"
								: "badge-error text-red-100 bg-red-500/20"
						}`}
					>
						{params.value}
					</span>
				);
			},
		},
		{
			headerName: "Amount",
			field: "amount",
			width: 100,
			cellRenderer: (params: any) => {
				const isTotal = params.node.rowPinned;
				const amount = params.value;

				if (isTotal) {
					return (
						<span className='text-primary font-bold text-base'>
							₹{amount.toLocaleString()}
						</span>
					);
				}

				return (
					<span
						className={
							params.data.txnType === "credit"
								? "text-success font-bold"
								: "text-error font-bold"
						}
					>
						₹{amount.toLocaleString()}
					</span>
				);
			},
		},
		// {
		// 	headerName: "Transaction Mode",
		// 	field: "txnMode",
		// 	flex: 1,
		// 	minWidth: 150,
		// },
		{
			headerName: "Counter Party",
			field: "counterParty",
			flex: 1,
			minWidth: 150,

			cellRenderer: (params: any) => {
				if (params.node.rowPinned) return "";
				return <span>{params.value}</span>;
			},
		},
		{
			headerName: "Date",
			field: "txnDatetime",
			width: 120,
			// valueFormatter: (params: any) =>
			// 	new Date(params.value).toLocaleDateString("en-IN", {
			// 		day: "2-digit",
			// 		month: "short",
			// 		// timeStyle: "medium",
			// 	}),

			cellRenderer: (params: any) => {
				if (params.node.rowPinned) return "";
				return (
					<span>
						{new Date(params.value).toLocaleDateString("en-IN", {
							day: "2-digit",
							month: "short",
							// timeStyle: "medium",
						})}
					</span>
				);
			},
		},
		{ headerName: "Method", field: "txnMethod", width: 100 },
		{ headerName: "Reference", field: "txnRef", width: 130 },
	];

	// Chart data with null checks
	const pieChartData = {
		labels: ["Credits", "Debits"],
		datasets: [
			{
				data: [stats?.totalCredit || 0, stats?.totalDebit || 0],
				backgroundColor: [greenbg, redbg],
				borderWidth: 1,
				borderColor: "#ffffff50",
			},
		],
	};

	const topCreditCounterPartiesData = {
		labels: stats?.topCreditCounterParties.map(cp => cp.name || "Unknown"),
		datasets: [
			{
				label: "Credit Amount (₹)",
				data: stats?.topCreditCounterParties.map(cp => cp.amount || 0),
				backgroundColor: greenbg,
				borderColor: "#059669",
				borderWidth: 1,
			},
		],
	};

	const topDebitCounterPartiesData = {
		labels: stats?.topDebitCounterParties.map(cp => cp.name || "Unknown"),
		datasets: [
			{
				label: "Debit Amount (₹)",
				data: stats?.topDebitCounterParties.map(cp => cp.amount || 0),
				backgroundColor: redbg,
				borderColor: "#dc2626",
				borderWidth: 1,
			},
		],
	};

	const monthlyTrendsData = {
		labels: stats?.monthlyTrends.map(mt => mt.month || ""),
		datasets: [
			{
				label: "Credits",
				data: stats?.monthlyTrends.map(mt => mt.credit || 0),
				borderColor: greenbg,
				backgroundColor: greenbg,
				tension: 0.1,
				fill: false,
				pointBackgroundColor: greenbg,
				pointBorderColor: "#059669",
				pointRadius: 4,
			},
			{
				label: "Debits",
				data: stats?.monthlyTrends.map(mt => mt.debit || 0),
				borderColor: redbg,
				backgroundColor: redbg,
				tension: 0.1,
				fill: false,
				pointBackgroundColor: redbg,
				pointBorderColor: "#dc2626",
				pointRadius: 4,
			},
		],
	};

	// Chart options
	const commonChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				labels: {
					color: "rgb(156, 163, 175)", // Tailwind gray-400
				},
			},
		},
		scales: {
			x: {
				ticks: {
					color: "rgb(156, 163, 175)",
				},
				grid: {
					color: "rgba(156, 163, 175, 0.1)",
				},
			},
			y: {
				ticks: {
					color: "rgb(156, 163, 175)",
					callback: function (value: any) {
						return "₹" + value.toLocaleString();
					},
				},
				grid: {
					color: "rgba(156, 163, 175, 0.1)",
				},
				beginAtZero: true,
			},
		},
	};

	const gridRef = useRef<AgGridReact>(null);

	const onTxnFilterChanged = useCallback(
		(event: any) => {
			if (gridApi) {
				gridApi.setGridOption("quickFilterText", event.target.value);
			}
			// gridRef.current!.api.setGridOption(
			// 	"quickFilterText",
			// 	(document.getElementById("txnFilterInput") as HTMLInputElement).value
			// );
		},
		[gridApi]
	);

	// const onTxnFilterChanged = (
	// 	event: React.ChangeEvent<HTMLInputElement>
	// ): void => {
	// 	if (gridApi) {
	// 		gridApi.setQuickFilter(event.target.value);
	// 	}
	// };

	if (isLoading) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-base-100'>
				<span className='loading loading-spinner loading-lg text-primary'></span>
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-base-100'>
				<div className='alert alert-error'>
					<span>Error loading transactions data</span>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-base-100 p-2 sm:p-4'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='flex flex-col w-full items-center sm:flex-row justify-between md:text-left text-center md:items-center my-6 gap-5'>
					<div className='w-full'>
						<div className='flex items-center md:justify-start justify-center gap-2'>
							<h1 className='text-3xl sm:text-4xl font-bold items-center text-base-content'>
								{username}'s Dashboard
							</h1>
							<img src='/sussy.png' className='w-10' alt='' />
						</div>
						<p className='text-base-content/60 text-md'>Ethu Nagarjuna vaa</p>
					</div>

					{/* Filter Controls */}
					<div className='flex flex-col w-full md:items-end items-center gap-4'>
						<div className='flex flex-between lg:gap-2 gap-1'>
							<button
								onClick={() => setDateFilter("monthly")}
								className={`btn btn-sm ${
									dateFilter === "monthly" ? "btn-primary" : "btn-soft"
								}`}
							>
								<Calendar className='w-4 h-4' />
								Monthly
							</button>
							{/* <button
								onClick={() => setDateFilter("7d")}
								className={`btn btn-sm ${
									dateFilter === "7d" ? "btn-primary" : "btn-soft"
								}`}
							>
								<Activity className='w-4 h-4' />
								Last Week
							</button> */}
							<button
								onClick={() => setDateFilter("custom")}
								className={`btn btn-sm ${
									dateFilter === "custom" ? "btn-primary" : "btn-soft"
								}`}
							>
								<Filter className='w-4 h-4' />
								Custom
							</button>
							<button
								className='btn btn-sm btn-error btn-soft'
								onClick={() => {
									(
										document.getElementById("my_modal_2") as HTMLDialogElement
									)?.showModal();
								}}
							>
								<LogOut className='w-4 h-4' />
								Logout
							</button>
							<dialog id='my_modal_2' className='modal'>
								<div className='modal-box'>
									<h3 className='font-bold text-lg'>Logout</h3>
									<p className='py-4'>Are you sure you want to logout?</p>
									<div className='flex items-end justify-end gap-2 w-full'>
										<button className='btn btn-error btn-soft' onClick={logout}>
											Logout
											<LogOut className='w-4 h-4' />
										</button>

										<form method='dialog'>
											<button className='btn btn-small btn-soft'>
												Cancel
												<XIcon className='w-4 h-4' />
											</button>
										</form>
									</div>
								</div>
								<form method='dialog' className='modal-backdrop'>
									<button>close</button>
								</form>
							</dialog>
						</div>

						{/* Monthly Navigation */}
						{dateFilter === "monthly" && (
							<div className='flex items-center justify-center gap-2'>
								<button
									onClick={() => navigateMonth("prev")}
									className='btn btn-sm btn-circle btn-soft'
								>
									<ChevronLeft />
								</button>
								<span className='text-sm font-medium min-w-32 text-center'>
									{getMonthName()}
								</span>
								<button
									onClick={() => navigateMonth("next")}
									className='btn btn-sm btn-circle btn-soft'
									disabled={
										currentMonth.month == lastMonth.month + 1 &&
										currentMonth.year == lastMonth.year
									}
								>
									<ChevronRight />
								</button>
							</div>
						)}

						<div className='flex items-center justify-center'></div>
					</div>
				</div>

				{/* Custom Date Range Inputs */}
				{dateFilter === "custom" && (
					<div className='card bg-base-200 shadow mb-4'>
						<div className='card-body p-4'>
							<h3 className='font-semibold mb-2'>Custom Date Range</h3>
							<div className='flex flex-col sm:flex-row gap-4'>
								<div className='form-control'>
									<label className='label'>
										<span className='label-text'>From Date</span>
									</label>
									<input
										type='date'
										className='input input-bordered input-sm'
										value={customDateRange.from}
										onChange={e =>
											setCustomDateRange(prev => ({
												...prev,
												from: e.target.value,
											}))
										}
									/>
								</div>
								<div className='form-control'>
									<label className='label'>
										<span className='label-text'>To Date</span>
									</label>
									<input
										type='date'
										className='input input-bordered input-sm'
										value={customDateRange.to}
										onChange={e =>
											setCustomDateRange(prev => ({
												...prev,
												to: e.target.value,
											}))
										}
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Stats Cards */}
				<div className='grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6'>
					<div className='stat bg-base-200 rounded-lg p-3'>
						<div className='stat-figure text-success'>
							<TrendingUp className='w-6 h-6' />
						</div>
						<div className='stat-title text-xs'>Total Credits</div>
						<div className='stat-value text-success text-lg lg:text-2xl'>
							₹{stats?.totalCredit.toLocaleString()}
						</div>
					</div>

					<div className='stat bg-base-200 rounded-lg p-3'>
						<div className='stat-figure text-error'>
							<TrendingDown className='w-6 h-6' />
						</div>
						<div className='stat-title text-xs'>Total Debits</div>
						<div className='stat-value text-error text-lg lg:text-2xl'>
							₹{stats?.totalDebit.toLocaleString()}
						</div>
					</div>

					<div className='stat bg-base-200 rounded-lg p-3'>
						<div className='stat-figure text-primary'>
							<DollarSign className='w-6 h-6' />
						</div>
						<div className='stat-title text-xs'>Net Balance</div>
						<div
							className={`stat-value text-lg lg:text-2xl ${
								stats && stats.netBalance >= 0 ? "text-success" : "text-error"
							}`}
						>
							₹{stats?.netBalance.toLocaleString()}
						</div>
					</div>

					<div className='stat bg-base-200 rounded-lg p-3'>
						<div className='stat-figure text-info'>
							<Activity className='w-6 h-6' />
						</div>
						<div className='stat-title text-xs'>Transactions</div>
						<div className='stat-value text-lg lg:text-2xl'>
							{stats?.totalTransactions}
						</div>
					</div>

					<div className='stat bg-base-200 rounded-lg p-3'>
						<div className='stat-figure text-warning'>
							<CreditCard className='w-6 h-6' />
						</div>
						<div className='stat-title text-xs'>Avg Amount</div>
						<div className='stat-value text-lg lg:text-2xl'>
							₹
							{stats && Math.round(stats.avgTransactionAmount).toLocaleString()}
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className='tabs tabs-box mb-4 md:justify-start justify-between'>
					<a
						className={`tab ${selectedTab === "overview" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("overview")}
					>
						Overview
					</a>
					<a
						className={`tab ${
							selectedTab === "transactions" ? "tab-active" : ""
						}`}
						onClick={() => setSelectedTab("transactions")}
					>
						Transactions
					</a>
					<a
						className={`tab ${selectedTab === "analytics" ? "tab-active" : ""}`}
						onClick={() => setSelectedTab("analytics")}
					>
						Analytics
					</a>
				</div>

				{/* Tab Content */}
				{selectedTab === "overview" && (
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
						{/* Credit vs Debit Pie Chart */}
						<div className='card bg-base-200 shadow'>
							<div className='card-body'>
								<h2 className='card-title text-lg'>
									<PieChart className='w-5 h-5' />
									Credit vs Debit
								</h2>
								<div className='h-64'>
									<Pie
										data={pieChartData}
										options={{
											responsive: true,
											maintainAspectRatio: false,
											plugins: {
												legend: {
													position: "bottom",
													labels: {
														color: "rgb(156, 163, 175)",
													},
												},
											},
										}}
									/>
								</div>
							</div>
						</div>

						{/* Daily/Period Trends */}
						<div className='card bg-base-200 shadow'>
							<div className='card-body'>
								<h2 className='card-title text-lg'>
									{dateFilter === "monthly"
										? "Daily Trends"
										: dateFilter === "7d"
										? "Daily Trends"
										: "Trends"}
								</h2>
								<div className='h-64'>
									<Line
										data={monthlyTrendsData}
										options={{
											...commonChartOptions,
											interaction: {
												intersect: false,
												mode: "index",
											},
											plugins: {
												...commonChartOptions.plugins,
												tooltip: {
													callbacks: {
														label: function (context: any) {
															return `${
																context.dataset.label
															}: ₹${context.parsed.y.toLocaleString()}`;
														},
													},
												},
											},
										}}
									/>
								</div>
							</div>
						</div>

						{/* Top Credit Counter Parties */}
						<div className='card bg-base-200 shadow'>
							<div className='card-body'>
								<h2 className='card-title text-lg text-success'>
									Top Credit Sources
								</h2>
								<div className='h-64'>
									<Bar
										data={topCreditCounterPartiesData}
										options={{
											...commonChartOptions,
											plugins: {
												legend: { display: false },
											},
										}}
									/>
								</div>
							</div>
						</div>

						{/* Top Debit Counter Parties */}
						<div className='card bg-base-200 shadow'>
							<div className='card-body'>
								<h2 className='card-title text-lg text-error'>
									Top Spending Categories
								</h2>
								<div className='h-64'>
									<Bar
										data={topDebitCounterPartiesData}
										options={{
											...commonChartOptions,
											plugins: {
												legend: { display: false },
											},
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{selectedTab === "transactions" && (
					<div className='card bg-base-200 shadow'>
						<div className='card-body'>
							<div className='w-full flex md:flex-row gap-2 flex-col items-center justify-between mb-4'>
								<h2 className='card-title text-lg'>Recent Transactions</h2>
								<label className='input'>
									<Search size={15} />
									<input
										type='text'
										id='txnFilterInput'
										placeholder='Search transactions...'
										onInput={onTxnFilterChanged}
									/>
								</label>
							</div>
							<div className='h-[600px] w-full' style={{ fontSize: "14px" }}>
								<AgGridReact
									ref={gridRef}
									theme={themeDarkBlue}
									rowData={filteredTransactions}
									pinnedBottomRowData={pinnedBottomData}
									columnDefs={columnDefs}
									defaultColDef={{
										sortable: true,
										filter: true,
										resizable: true,
										flex: 1,
										minWidth: 100,
									}}
									pagination={true}
									paginationPageSize={20}
									domLayout='normal'
									suppressHorizontalScroll={false}
									onGridReady={(params: GridReadyEvent) => {
										setGridApi(params.api);
										params.api.sizeColumnsToFit();
										// Calculate initial total
										const initialTotal = calculateVisibleTotal(params.api);
										setTotalAmount(initialTotal);
									}}
									onFilterChanged={onFilterChanged}
								/>
							</div>
						</div>
					</div>
				)}

				{selectedTab === "analytics" && (
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
						{/* Transaction Methods */}
						<div className='card bg-base-200 shadow'>
							<div className='card-body'>
								<h2 className='card-title text-lg'>Payment Methods</h2>
								<div className='space-y-2'>
									{stats?.transactionsByMethod.map((method, idx) => (
										<div
											key={idx}
											className='flex justify-between items-center'
										>
											<span className='badge badge-soft'>{method.method}</span>
											<span className='font-semibold'>
												{method.count} transactions
											</span>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Credit Counter Party Analysis */}
						<div className='card bg-base-200 shadow'>
							<div className='card-body'>
								<h2 className='card-title text-lg text-success'>
									Top Credit Sources
								</h2>
								<div className='space-y-3'>
									{stats?.topCreditCounterParties
										.slice(0, 10)
										.map((cp, idx) => (
											<div key={idx} className='flex flex-col gap-1'>
												<div className='flex justify-between items-center'>
													<span className='font-medium truncate'>
														{cp.name}
													</span>
													<span className='text-sm text-success'>
														₹{cp.amount.toLocaleString()}
													</span>
												</div>
												<div className='flex justify-between items-center text-xs text-base-content/60'>
													<span>{cp.count} transactions</span>
													<span>
														₹{Math.round(cp.amount / cp.count).toLocaleString()}{" "}
														avg
													</span>
												</div>
												<div className='divider my-1'></div>
											</div>
										))}
								</div>
							</div>
						</div>

						{/* Debit Counter Party Analysis */}
						<div className='card bg-base-200 shadow'>
							<div className='card-body'>
								<h2 className='card-title text-lg text-error'>
									Top Spending Categories
								</h2>
								<div className='space-y-3'>
									{stats?.topDebitCounterParties.slice(0, 10).map((cp, idx) => (
										<div key={idx} className='flex flex-col gap-1'>
											<div className='flex justify-between items-center'>
												<span className='font-medium truncate'>{cp.name}</span>
												<span className='text-sm text-error'>
													₹{cp.amount.toLocaleString()}
												</span>
											</div>
											<div className='flex justify-between items-center text-xs text-base-content/60'>
												<span>{cp.count} transactions</span>
												<span>
													₹{Math.round(cp.amount / cp.count).toLocaleString()}{" "}
													avg
												</span>
											</div>
											<div className='divider my-1'></div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Dashboard;
