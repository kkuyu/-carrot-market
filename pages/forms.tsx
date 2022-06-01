import { useState } from "react";
import { NextPage } from "next";

const Forms: NextPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState("");
  const [emailError, setEmailError] = useState("");

  const onUsernameChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = event;
    setFormErrors("");
    setUsername(value);
  };
  const onEmailChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = event;
    setFormErrors("");
    setEmailError("");
    setEmail(value);
  };
  const onPasswordChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = event;
    setFormErrors("");
    setPassword(value);
  };
  const onSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (username === "" || email === "" || password === "") {
      setFormErrors("All fields are required");
    }
    if (!email.includes("@")) {
      setEmailError("Email is invalid");
    }
  };

  return (
    <div>
      <form onSubmit={onSubmit} noValidate>
        <input value={username} onChange={onUsernameChange} type="text" placeholder="Username" required />
        <input value={email} onChange={onEmailChange} type="email" placeholder="Email" required />
        <p>{emailError}</p>
        <input value={password} onChange={onPasswordChange} type="password" placeholder="Password" required />
        <button type="submit">Create Account</button>
        <p>{formErrors}</p>
      </form>
    </div>
  );
};

export default Forms;
