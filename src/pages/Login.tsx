import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
	const [isHovered, setIsHovered] = useState(false);
	const { handleLogin } = useAuth();

	return (
		<div
			className='min-h-screen bg-base-100 relative overflow-hidden'
			data-theme='dark'
		>
			{/* Animated background elements */}
			<div className='absolute inset-0'>
				{/* Grid pattern */}
				<div className='absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]'></div>

				{/* Floating orbs with DaisyUI colors */}
				<div className='absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse'></div>
				<div
					className='absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse'
					style={{ animationDelay: "2s" }}
				></div>
				<div
					className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse'
					style={{ animationDelay: "4s" }}
				></div>

				{/* Gradient overlay */}
				<div className='absolute inset-0 bg-gradient-to-t from-base-100/80 to-transparent'></div>
			</div>

			{/* Main content */}
			<div className='relative z-10 flex items-center justify-center min-h-screen p-4'>
				<div className='w-full max-w-md'>
					{/* Logo/Brand section */}
					<div className='text-center mb-12'>
						<div className='inline-flex items-center justify-center mb-6 p-1'>
							{/* <span className='text-2xl font-bold text-primary-content'>T</span> */}
							<img src='/sussy.png' className='w-24 mt-2' alt='sussy nigga' />
						</div>
						<h1 className='text-4xl font-bold bg-gradient-to-r from-base-content to-gray-100 bg-clip-text text-transparent mb-2'>
							Trans Ma Action, Nigga
						</h1>
						<p className='text-base-content/70 text-lg'>Ethu Nagarjuna vaa</p>
					</div>

					{/* Login card */}
					<div className='card bg-base-200/50 backdrop-blur-xl border rounded-lg border-gray-300/20'>
						<div className='card-body p-8'>
							<div className='text-center mb-8'>
								<h2 className='text-2xl font-semibold text-base-content mb-2'>
									Welcome back
								</h2>
								<p className='text-base-content/70'>
									Sign in to continue your journey
								</p>
							</div>

							{/* Google login button */}
							<button
								onClick={handleLogin}
								onMouseEnter={() => setIsHovered(true)}
								onMouseLeave={() => setIsHovered(false)}
								className='w-full group relative overflow-hidden bg-white hover:bg-gray-50 text-gray-900 font-medium py-4 px-6 rounded-2xl transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] border border-gray-200 cursor-pointer'
							>
								{/* Button background animation */}
								<div
									className={`absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 transform transition-transform duration-300 ${
										isHovered ? "translate-x-0" : "-translate-x-full"
									}`}
								></div>

								<div className='relative flex items-center justify-center space-x-3'>
									<svg
										aria-label='Google logo'
										width='20'
										height='20'
										xmlns='http://www.w3.org/2000/svg'
										viewBox='0 0 512 512'
										className='transition-transform duration-300 group-hover:rotate-12'
									>
										<g>
											<path d='m0 0H512V512H0' fill='#fff'></path>
											<path
												fill='#34a853'
												d='M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341'
											></path>
											<path
												fill='#4285f4'
												d='m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57'
											></path>
											<path
												fill='#fbbc02'
												d='m90 341a208 200 0 010-171l63 49q-12 37 0 73'
											></path>
											<path
												fill='#ea4335'
												d='m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55'
											></path>
										</g>
									</svg>
									<span className='text-lg'>Continue with Google</span>
								</div>
							</button>

							{/* Divider */}
							{/* <div className='divider text-base-content/50'>or</div> */}

							{/* Alternative options */}
							{/* <div className='space-y-3'>
								<button className='btn btn-ghost btn-block justify-start'>
									<svg
										className='w-5 h-5'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path
											fillRule='evenodd'
											d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
											clipRule='evenodd'
										></path>
									</svg>
									Continue as Guest
								</button>

								<button className='btn btn-accent btn-outline btn-block justify-start'>
									<svg
										className='w-5 h-5'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z'></path>
										<path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z'></path>
									</svg>
									Magic Link Login
								</button>
							</div> */}

							{/* Feature badges */}
							{/* <div className='flex flex-wrap gap-2 mt-6 justify-center'>
								<div className='badge badge-primary badge-sm'>
									<svg
										className='w-3 h-3 mr-1'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path
											fillRule='evenodd'
											d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z'
											clipRule='evenodd'
										></path>
									</svg>
									Secure
								</div>
								<div className='badge badge-secondary badge-sm'>
									<svg
										className='w-3 h-3 mr-1'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z'></path>
									</svg>
									Team Ready
								</div>
								<div className='badge badge-accent badge-sm'>
									<svg
										className='w-3 h-3 mr-1'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path
											fillRule='evenodd'
											d='M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z'
											clipRule='evenodd'
										></path>
									</svg>
									Lightning Fast
								</div>
							</div> */}
						</div>
					</div>

					{/* Footer */}
					<div className='text-center mt-8'>
						<p className='text-base-content/60 text-sm'>
							<a
								href='mailto:work@priyankishore.dev'
								className='link link-primary link-hover font-medium'
								target='_blank'
								rel='noopener noreferrer'
							>
								Request to create Account.{" "}
							</a>
							This works with:
						</p>
						<div className='flex items-center justify-center space-x-6 mt-6 text-xs text-base-content/50'>
							<a href='#' className='link link-hover bg-white p-2 rounded'>
								<img src='/axis.png' className='w-30' alt='' />
							</a>
							{/* <span>•</span> */}
						</div>
					</div>
				</div>
			</div>

			{/* Floating elements with theme colors */}
			<div className='absolute top-10 left-10 w-2 h-2 bg-primary rounded-full animate-ping'></div>
			<div
				className='absolute bottom-10 left-1/4 w-1 h-1 bg-secondary rounded-full animate-ping'
				style={{ animationDelay: "1s" }}
			></div>
			<div
				className='absolute top-1/4 right-10 w-1.5 h-1.5 bg-accent rounded-full animate-ping'
				style={{ animationDelay: "3s" }}
			></div>

			{/* Bottom gradient accent */}
			<div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none'></div>
		</div>
	);
};

export default Login;
