import { Component } from "react";
import React from 'react';
import { Link } from "react-router-dom";
class Form extends Component{
    state = {
        email:'',
        password:'',
    }
    handleSubmit = () => {
        const { userDetails, loading } = this.props;
        if (!loading && userDetails) {
            userDetails(this.state.email, this.state.password);
        }
    }

    handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            this.handleSubmit();
        }
    }

    handleFormSubmit = (e) => {
        e.preventDefault();
        this.handleSubmit();
    }

    render(){
        const {name, error, userDetails, reset, loading, variant} = this.props;
        const isLoginVariant = variant === 'login';
        const hasError = error && error.trim() !== '';
        const containerClasses = isLoginVariant
            ? 'w-full flex flex-col text-start'
            : `w-fit flex-col items-center text-start flex border-2 rounded-3xl pt-10 pb-2 px-16 ${hasError ? 'border-[#B31212]' : 'border-black'}`;
        const inputClasses = isLoginVariant
            ? 'w-full text-sm my-1.5 h-11 px-3 rounded-lg border border-gray-300 bg-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-0 focus-visible:border-[var(--color-primary)] disabled:opacity-50'
            : 'w-64 text-xs my-3 h-[45px] p-2 bg-[#F8F8F8]';
        const labelClasses = isLoginVariant ? 'block text-sm font-medium text-gray-700 mt-2.5 first:mt-0 mb-0.5' : 'w-full justify-self-start';
        const submitIsPrimary = isLoginVariant;
        const submitClasses = submitIsPrimary
            ? `mt-4 w-full h-11 flex justify-center items-center rounded-lg font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001f54] disabled:opacity-60 disabled:cursor-not-allowed ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#001f54] hover:bg-[#003366] active:bg-[#001a47]'}`
            : `my-3 w-28 h-8 flex justify-center items-center ${loading ? 'bg-[#A0A0A0] cursor-not-allowed opacity-50' : 'bg-[#C4C4C4] cursor-pointer'}`;
        const submitButton = (
            <button
                type={isLoginVariant ? 'submit' : 'button'}
                className={submitClasses}
                onClick={isLoginVariant ? undefined : this.handleSubmit}
                disabled={loading}
                aria-busy={loading}
            >
                {loading ? 'Loading...' : name}
            </button>
        );
        const formContent = (
            <>
                <label data-testid="username-label" htmlFor="form-username" className={labelClasses}>Username</label>
                <input
                    id="form-username"
                    data-testid="email"
                    type="text"
                    autoComplete="username"
                    placeholder={isLoginVariant ? 'pennstudent' : undefined}
                    className={inputClasses}
                    onChange={(event) => this.setState({email:event.target.value})}
                    onKeyPress={this.handleKeyPress}
                    value={this.state.email}
                    disabled={loading}
                    aria-invalid={hasError}
                />
                <label className={labelClasses} htmlFor="form-password">Password</label>
                <input
                    id="form-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={isLoginVariant ? '••••••••' : undefined}
                    className={inputClasses}
                    onChange={(event) => this.setState({password:event.target.value})}
                    onKeyPress={this.handleKeyPress}
                    value={this.state.password}
                    disabled={loading}
                    aria-invalid={hasError}
                />
                {submitButton}
            </>
        );
        return(
            <div data-testid="form" className="flex items-center flex-col">
                <div className={containerClasses}>
                    {isLoginVariant ? (
                        <form onSubmit={this.handleFormSubmit} className="w-full flex flex-col text-start">
                            {formContent}
                        </form>
                    ) : (
                        formContent
                    )}
                </div>
                {hasError && (
                    <div className="mt-4 w-full rounded-lg bg-red-50 border border-red-200 flex justify-between items-center px-4 py-3">
                        <span data-testid="error" className="text-sm text-red-700">{error}</span>
                        <button type="button" onClick={() => reset()} className="text-red-600 hover:text-red-800 p-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded" aria-label="Dismiss error">×</button>
                    </div>
                )}
            </div>
        )
    }
}


export default Form;