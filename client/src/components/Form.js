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

    render(){
        const {name, error, userDetails, reset, loading} = this.props;
        // Only show error styling when error exists and is not empty
        const hasError = error && error.trim() !== '';
        const error_class = hasError ? 'border-[#B31212]' : 'border-black';
        const classes = `w-fit  flex-col items-center text-start flex border-2 rounded-3xl pt-10 pb-2 px-16 ${error_class}`
        return(
            <div data-testid="form" className="flex items-center flex-col">
                <div  className={classes}>
                    <div data-testid="username-label" className="w-full justify-self-start">Username</div>
                    <input
                    data-testid="email"
                        type='email'
                        className="w-64 text-xs my-3 h-[45px] p-2 bg-[#F8F8F8]"
                        onChange={(event) => this.setState({email:event.target.value})}
                        onKeyPress={this.handleKeyPress}
                        value={this.state.email}
                        disabled={loading}
                    ></input>
                    <div className="w-full justify-self-start">Password</div>
                    <input
                        type='password'
                        className="w-64 text-xs my-3 h-[45px] p-2 bg-[#F8F8F8]"
                        onChange={(event) => this.setState({password:event.target.value})}
                        onKeyPress={this.handleKeyPress}
                        value={this.state.password}
                        disabled={loading}
                    >
                    </input>
                    <div
                        className={`my-3 w-28 h-8 flex justify-center items-center ${
                            loading 
                                ? 'bg-[#A0A0A0] cursor-not-allowed opacity-50' 
                                : 'bg-[#C4C4C4] cursor-pointer'
                        }`}
                        onClick={this.handleSubmit}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && !loading && this.handleSubmit()}
                    >
                        {loading ? 'Loading...' : name}
                    </div>
                    
                </div>
                {hasError && (
                    <div className="bg-[#B312120D] my-10 border-[#B31212] border h-10 flex justify-center items-center p-5 text-center flex-row">
                        <div data-testid="error" className="text-[#B31212]">{error}</div>
                        <div 
                            onClick={() => reset()}
                            className="mx-5 cursor-pointer">
                            <div className="text-[#B31212]">x</div>
                        </div>
                    </div>
                )}
            </div>
            
        )
    }
}


export default Form;