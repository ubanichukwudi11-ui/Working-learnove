"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  GraduationCap,
  Users,
  School,
} from "lucide-react";

import { supabase } from "@/lib/supabase";


type Role =
  | "STUDENT"
  | "TEACHER"
  | "PARENT";


export default function SelectRolePage() {

  const router = useRouter();

  const [loading, setLoading] =
    useState(false);


  async function chooseRole(
    role: Role
  ) {

    try {

      setLoading(true);


      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();


      if (!user) {

        router.replace("/login");

        return;
      }


      const fullName =
        user.user_metadata
          ?.full_name ||
        user.user_metadata
          ?.name ||
        "";


      const avatar =
        user.user_metadata
          ?.avatar_url ||
        "";



      // Create main profile

      const {
        error: profileError,

      } = await supabase
        .from("profiles")
        .upsert({

          id: user.id,

          email:
            user.email,

          full_name:
            fullName,

          avatar_url:
            avatar,

          role,

          status:
            role === "TEACHER"
              ? "PENDING"
              : "ACTIVE",

        });



      if (profileError) {

        throw profileError;

      }




      // STUDENT

      if (
        role === "STUDENT"
      ) {


        const {
          error,
        } = await supabase
          .from(
            "student_profiles"
          )
          .upsert({

            id:user.id,

          });


        if(error)
          throw error;



        router.replace(
          "/dashboard"
        );


        return;

      }





      // PARENT

      if (
        role === "PARENT"
      ) {


        const {
          error,
        } = await supabase
          .from(
            "parent_profiles"
          )
          .upsert({

            id:user.id,

          });



        if(error)
          throw error;



        router.replace(
          "/parent"
        );


        return;

      }





      // TEACHER

      if (
        role === "TEACHER"
      ) {


        const {
          error,
        } = await supabase
          .from(
            "teacher_profiles"
          )
          .upsert({

            id:user.id,

            status:
              "PENDING",

          });



        if(error)
          throw error;



        router.replace(
          "/register/teacher"
        );


        return;

      }



    } catch(error:any) {


      console.error(
        error
      );


      alert(
        error.message ||
        "Something went wrong"
      );


    } finally {

      setLoading(false);

    }

  }





  function RoleCard({

    icon,

    title,

    description,

    role,

  }:{

    icon:React.ReactNode;

    title:string;

    description:string;

    role:Role;

  }) {


    return (

      <button

        disabled={loading}

        onClick={() =>
          chooseRole(role)
        }

        className="
          group
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          text-left
          transition
          hover:border-cyan-500
          hover:-translate-y-1
          disabled:opacity-50
        "

      >

        <div
          className="
            mb-6
            text-cyan-400
            group-hover:scale-110
            transition
          "
        >

          {icon}

        </div>



        <h2
          className="
            text-2xl
            font-bold
            text-white
          "
        >

          {title}

        </h2>



        <p
          className="
            mt-3
            leading-7
            text-slate-400
          "
        >

          {description}

        </p>


      </button>

    );

  }





  return (

    <main
      className="
        min-h-screen
        bg-[#030712]
        px-6
        py-20
        text-white
      "
    >

      <div
        className="
          mx-auto
          max-w-6xl
        "
      >


        <div
          className="
            text-center
            mb-14
          "
        >

          <h1
            className="
              text-5xl
              font-black
            "
          >

            Welcome to Learnova

          </h1>


          <p
            className="
              mt-5
              text-lg
              text-slate-400
            "
          >

            Choose how you want to use Learnova.

          </p>


        </div>




        <div
          className="
            grid
            gap-8
            md:grid-cols-3
          "
        >


          <RoleCard

            icon={
              <GraduationCap size={42}/>
            }

            title="Student"

            description="
              Learn with AI,
              join live classes,
              complete assignments,
              and track your progress.
            "

            role="STUDENT"

          />




          <RoleCard

            icon={
              <School size={42}/>
            }

            title="Teacher"

            description="
              Teach students,
              host live classes,
              upload lessons,
              and manage your classroom.
            "

            role="TEACHER"

          />




          <RoleCard

            icon={
              <Users size={42}/>
            }

            title="Parent"

            description="
              Monitor your child's
              learning progress,
              attendance, and results.
            "

            role="PARENT"

          />


        </div>



        {
          loading && (

            <div
              className="
                mt-10
                text-center
                text-cyan-400
                font-semibold
              "
            >

              Creating your Learnova account...

            </div>

          )
        }



      </div>


    </main>

  );

}