import { useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { NextPage } from "next";

interface LoginForm {
  username: string;
  password: string;
  email: string;
}

interface DelayTest {
  success: boolean;
  errors: { type: "username" | "password" | "email"; message: string }[];
}

const delayTest = (ms: number): Promise<DelayTest> => {
  return new Promise((resolve) =>
    setTimeout(() => {
      const random = Math.random();
      let result: DelayTest = { success: false, errors: [] };
      if (random < 0.3) {
        result.errors.push({ type: "email", message: "Email is already taken" });
      }
      if (random < 0.7) {
        result.errors.push({ type: "username", message: "Username is already taken" });
      }
      if (!result.errors.length) {
        result.success = true;
      }
      resolve(result);
    }, ms)
  );
};

const Forms: NextPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
  } = useForm<LoginForm>({
    mode: "onBlur",
  });

  const onValid = async (data: LoginForm) => {
    console.log("onValid", data);
    const result = await delayTest(200);
    if (!result.success) {
      result.errors.forEach((error) => {
        setError(error.type, { message: error.message });
      });
    }
  };

  const onInvalid = (errors: FieldErrors<LoginForm>) => {
    console.log("onInvalid", errors);
  };

  setValue("username", "Hello");

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
          className={`${Boolean(errors.username) ? "border-red-500" : ""}`}
        />
        {errors.username?.message}
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
