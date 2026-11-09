"use client";

import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Video, Clock, Users } from "lucide-react";

const classes = [
  {
    subject: "Physics",
    teacher: "Mr. James",
    time: "9:00 AM",
    status: "LIVE",
  },
  {
    subject: "Mathematics",
    teacher: "Mrs. Sarah",
    time: "11:00 AM",
    status: "Upcoming",
  },
  {
    subject: "Chemistry",
    teacher: "Dr. Alex",
    time: "2:00 PM",
    status: "Upcoming",
  },
];

export default function LiveClasses() {
  return (
    <section id="live" className="py-28 bg-[#111827] px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-cyan-400 font-semibold">
            Live Learning
          </span>

          <h2 className="text-5xl font-black mt-4">
            Attend Interactive Classes
          </h2>

          <p className="text-slate-400 mt-5 max-w-2xl mx-auto">
            Learn directly from experienced teachers with live
            video classes, real-time questions and class recordings.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {classes.map((item, index) => (
            <motion.div
              key={item.subject}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card hover className="p-6">
                <div className="flex justify-between items-center">
                  <Video className="text-cyan-400" />

                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      item.status === "LIVE"
                        ? "bg-red-500 text-white"
                        : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold">
                  {item.subject}
                </h3>

                <p className="text-slate-400 mt-2">
                  {item.teacher}
                </p>

                <div className="flex items-center gap-2 mt-6 text-slate-400">
                  <Clock size={18} />
                  {item.time}
                </div>

                <div className="flex items-center gap-2 mt-3 text-slate-400">
                  <Users size={18} />
                  250 Students
                </div>

                <Button fullWidth className="mt-8">
                  Join Class
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}