import { useState } from "react";
import { useForm } from "react-hook-form";
import { NextPage } from "next";

const Forms: NextPage = () => {
  const { register } = useForm();

  return (
    <div>
      <form noValidate>
        <input {...register("username")} type="text" placeholder="Username" required />
        <input {...register("email")} type="email" placeholder="Email" required />
        <input {...register("password")} type="password" placeholder="Password" required />
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
};

export default Forms;
