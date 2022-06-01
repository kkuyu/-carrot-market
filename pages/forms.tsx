import { useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { NextPage } from "next";

interface LoginForm {
  username: string;
  password: string;
  email: string;
}

const Forms: NextPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    mode: "onBlur",
  });

  const onValid = (data: LoginForm) => {
    console.log("onValid", data);
  };

  const onInvalid = (errors: FieldErrors<LoginForm>) => {
    console.log("onInvalid", errors);
  };

  return (
    <div>
      <form noValidate onSubmit={handleSubmit(onValid, onInvalid)}>
        <input
          {...register("username", {
            required: "Username is required",
            minLength: {
              message: "The username should be longer than 5 chars.",
              value: 5,
            },
          })}
          type="text"
          placeholder="Username"
          required
          minLength={5}
        />
        <input
          {...register("email", {
            required: "Email is required",
            validate: {
              notGmail: (value) => !value.includes("@gmail.com") || "Gmail is not allowed",
            },
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i,
              message: "Email is invalid",
            },
          })}
          type="email"
          placeholder="Email"
          required
          className={`${Boolean(errors.email) ? "border-red-500" : ""}`}
        />
        {errors.email?.message}
        <input {...register("password", { required: "Password is required" })} type="password" placeholder="Password" required />
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
};

export default Forms;
