import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Building,
	Calendar,
	CreditCard,
	DollarSign,
	FileText,
	Hash,
	Plus,
	User,
	X,
} from "lucide-react";
import React, { useState } from "react";
import { BASE_URL, useApi } from "../utils/api";

interface Transaction {
	id?: number;
	userEmail: string;
	amount: number;
	accountNumber: string;
	txnMethod: string;
	txnMode: string;
	txnType: string;
	txnRef: string;
	counterParty: string;
	txnInfo: string;
	txnDatetime: string;
	createdTime?: string;
}

interface AddTransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	userEmail?: string;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
	isOpen,
	onClose,
	userEmail = "",
}) => {
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState<
		Omit<Transaction, "id" | "createdTime">
	>({
		userEmail: userEmail,
		amount: 0,
		accountNumber: "",
		txnMethod: "",
		txnMode: "",
		txnType: "",
		txnRef: "",
		counterParty: "",
		txnInfo: "",
		txnDatetime: new Date().toISOString().slice(0, 16),
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const { fetchWithToken } = useApi();

	const addTransaction = async (
		transaction: Omit<Transaction, "id" | "createdTime">
	): Promise<Transaction> => {
		const response = await fetchWithToken(`${BASE_URL}/txns/add`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				...transaction,
				txnDatetime: new Date(transaction.txnDatetime).toISOString(),
			}),
		});

		if (!response.ok) {
			throw new Error("Failed to add transaction");
		}

		return response.json();
	};

	const addTransactionMutation = useMutation({
		mutationFn: addTransaction,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			resetForm();
			onClose();
		},
		onError: error => {
			console.error("Failed to add transaction:", error);
			setErrors({ submit: "Failed to add transaction. Please try again." });
		},
	});

	const resetForm = () => {
		setFormData({
			userEmail: userEmail,
			amount: 0,
			accountNumber: "",
			txnMethod: "",
			txnMode: "",
			txnType: "",
			txnRef: "",
			counterParty: "",
			txnInfo: "",
			txnDatetime: new Date().toISOString().slice(0, 16),
		});
		setErrors({});
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.userEmail.trim()) {
			newErrors.userEmail = "User email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.userEmail)) {
			newErrors.userEmail = "Please enter a valid email";
		}

		if (formData.amount <= 0) {
			newErrors.amount = "Amount must be greater than 0";
		}

		if (!formData.accountNumber.trim()) {
			newErrors.accountNumber = "Account number is required";
		}

		if (!formData.txnMethod.trim()) {
			newErrors.txnMethod = "Transaction method is required";
		}

		if (!formData.txnMode.trim()) {
			newErrors.txnMode = "Transaction mode is required";
		}

		if (!formData.txnType.trim()) {
			newErrors.txnType = "Transaction type is required";
		}

		if (!formData.txnRef.trim()) {
			newErrors.txnRef = "Transaction reference is required";
		}

		if (!formData.counterParty.trim()) {
			newErrors.counterParty = "Counter party is required";
		}

		if (!formData.txnDatetime) {
			newErrors.txnDatetime = "Transaction date and time is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: name === "amount" ? parseFloat(value) || 0 : value,
		}));

		if (errors[name]) {
			setErrors(prev => ({ ...prev, [name]: "" }));
		}
	};

	const handleSubmit = () => {
		if (!validateForm()) {
			return;
		}

		addTransactionMutation.mutate(formData);
	};

	const handleModalClose = () => {
		if (!addTransactionMutation.isPending) {
			resetForm();
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4'>
			<div className='bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
				<div className='flex items-center justify-between p-6 border-b border-base-300'>
					<h2 className='text-xl font-semibold flex items-center gap-2'>
						<Plus className='text-primary' size={20} />
						Add New Transaction
					</h2>
					<button
						onClick={handleModalClose}
						className='btn btn-ghost btn-sm btn-circle'
						disabled={addTransactionMutation.isPending}
					>
						<X size={20} />
					</button>
				</div>

				<div className='p-6 space-y-4'>
					{errors.submit && (
						<div className='alert alert-error'>{errors.submit}</div>
					)}

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='form-control'>
							<label className='label'>
								<span className='label-text flex items-center gap-1'>
									<User size={16} />
									User Email *
								</span>
							</label>
							<input
								type='email'
								name='userEmail'
								value={formData.userEmail}
								onChange={handleInputChange}
								className={`input input-bordered ${
									errors.userEmail ? "input-error" : ""
								}`}
								placeholder='user@example.com'
							/>
							{errors.userEmail && (
								<span className='text-error text-xs mt-1'>
									{errors.userEmail}
								</span>
							)}
						</div>

						<div className='form-control'>
							<label className='label'>
								<span className='label-text flex items-center gap-1'>
									<DollarSign size={16} />
									Amount *
								</span>
							</label>
							<input
								type='number'
								name='amount'
								value={formData.amount}
								onChange={handleInputChange}
								className={`input input-bordered ${
									errors.amount ? "input-error" : ""
								}`}
								placeholder='0.00'
								step='0.01'
								min='0'
							/>
							{errors.amount && (
								<span className='text-error text-xs mt-1'>{errors.amount}</span>
							)}
						</div>

						<div className='form-control'>
							<label className='label'>
								<span className='label-text flex items-center gap-1'>
									<Building size={16} />
									Account Number *
								</span>
							</label>
							<input
								type='text'
								name='accountNumber'
								value={formData.accountNumber}
								onChange={handleInputChange}
								className={`input input-bordered ${
									errors.accountNumber ? "input-error" : ""
								}`}
								placeholder='Account number'
							/>
							{errors.accountNumber && (
								<span className='text-error text-xs mt-1'>
									{errors.accountNumber}
								</span>
							)}
						</div>

						<div className='form-control'>
							<label className='label'>
								<span className='label-text flex items-center gap-1'>
									<CreditCard size={16} />
									Transaction Method *
								</span>
							</label>
							<select
								name='txnMethod'
								value={formData.txnMethod}
								onChange={handleInputChange}
								className={`select select-bordered ${
									errors.txnMethod ? "select-error" : ""
								}`}
							>
								<option value=''>Select method</option>
								<option value='card'>Card</option>
								<option value='bank_transfer'>Bank Transfer</option>
								<option value='cash'>Cash</option>
								<option value='check'>Check</option>
								<option value='mobile_payment'>Mobile Payment</option>
							</select>
							{errors.txnMethod && (
								<span className='text-error text-xs mt-1'>
									{errors.txnMethod}
								</span>
							)}
						</div>

						<div className='form-control'>
							<label className='label'>
								<span className='label-text'>Transaction Mode *</span>
							</label>
							<select
								name='txnMode'
								value={formData.txnMode}
								onChange={handleInputChange}
								className={`select select-bordered ${
									errors.txnMode ? "select-error" : ""
								}`}
							>
								<option value=''>Select mode</option>
								<option value='online'>Online</option>
								<option value='offline'>Offline</option>
								<option value='automatic'>Automatic</option>
							</select>
							{errors.txnMode && (
								<span className='text-error text-xs mt-1'>
									{errors.txnMode}
								</span>
							)}
						</div>

						<div className='form-control'>
							<label className='label'>
								<span className='label-text'>Transaction Type *</span>
							</label>
							<select
								name='txnType'
								value={formData.txnType}
								onChange={handleInputChange}
								className={`select select-bordered ${
									errors.txnType ? "select-error" : ""
								}`}
							>
								<option value=''>Select type</option>
								<option value='debit'>Debit</option>
								<option value='credit'>Credit</option>
								<option value='transfer'>Transfer</option>
								<option value='deposit'>Deposit</option>
								<option value='withdrawal'>Withdrawal</option>
							</select>
							{errors.txnType && (
								<span className='text-error text-xs mt-1'>
									{errors.txnType}
								</span>
							)}
						</div>

						<div className='form-control'>
							<label className='label'>
								<span className='label-text flex items-center gap-1'>
									<Hash size={16} />
									Transaction Reference *
								</span>
							</label>
							<input
								type='text'
								name='txnRef'
								value={formData.txnRef}
								onChange={handleInputChange}
								className={`input input-bordered ${
									errors.txnRef ? "input-error" : ""
								}`}
								placeholder='Transaction reference'
							/>
							{errors.txnRef && (
								<span className='text-error text-xs mt-1'>{errors.txnRef}</span>
							)}
						</div>

						<div className='form-control'>
							<label className='label'>
								<span className='label-text'>Counter Party *</span>
							</label>
							<input
								type='text'
								name='counterParty'
								value={formData.counterParty}
								onChange={handleInputChange}
								className={`input input-bordered ${
									errors.counterParty ? "input-error" : ""
								}`}
								placeholder='Counter party name'
							/>
							{errors.counterParty && (
								<span className='text-error text-xs mt-1'>
									{errors.counterParty}
								</span>
							)}
						</div>

						<div className='form-control'>
							<label className='label'>
								<span className='label-text flex items-center gap-1'>
									<Calendar size={16} />
									Transaction Date & Time *
								</span>
							</label>
							<input
								type='datetime-local'
								name='txnDatetime'
								value={formData.txnDatetime}
								onChange={handleInputChange}
								className={`input input-bordered ${
									errors.txnDatetime ? "input-error" : ""
								}`}
							/>
							{errors.txnDatetime && (
								<span className='text-error text-xs mt-1'>
									{errors.txnDatetime}
								</span>
							)}
						</div>
						<div className='form-control'>
							<label className='label'>
								<span className='label-text flex items-center gap-1'>
									<FileText size={16} />
									Payment Details
								</span>
							</label>
							<input
								type='text'
								name='txnInfo'
								value={formData.txnInfo}
								onChange={handleInputChange}
								className='input input-bordered'
								placeholder='e.g., UPI/P2M/123456789/SmartQ (optional)'
							/>
						</div>
					</div>

					<div className='flex justify-end gap-3 pt-4 border-t border-base-300'>
						<button
							type='button'
							onClick={handleModalClose}
							className='btn btn-ghost'
							disabled={addTransactionMutation.isPending}
						>
							Cancel
						</button>
						<button
							type='button'
							onClick={handleSubmit}
							className='btn btn-primary'
							disabled={addTransactionMutation.isPending}
						>
							{addTransactionMutation.isPending ? (
								<>
									<span className='loading loading-spinner loading-sm'></span>
									Adding...
								</>
							) : (
								<>
									<Plus size={16} />
									Add Transaction
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AddTransactionModal;
