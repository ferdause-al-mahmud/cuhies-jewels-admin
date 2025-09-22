"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import loadingImage from "../../../assets/loadingCJ1.png";

export default function Loader() {
  return (
    <div className="h-[100vh] w-full flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src={loadingImage}
          alt="Loading..."
          width={200}
          height={200}
          className="object-contain"
          priority
        />
      </motion.div>
    </div>
  );
}
