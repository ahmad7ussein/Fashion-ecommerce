"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
export function AnimatedCard({ children, delay = 0, className = "" }) {
    return (<motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{
            duration: 0.6,
            delay,
            ease: [0.21, 0.47, 0.32, 0.98],
        }} whileHover={{
            scale: 1.05,
            transition: { duration: 0.2 },
        }} className={className}>
      <Card className="h-full overflow-hidden group cursor-pointer">
        {children}
      </Card>
    </motion.div>);
}
export function AnimatedProductCard({ image, name, price, category, delay = 0, formatPrice }) {
    const displayPrice = formatPrice ? formatPrice(price) : `$${price.toFixed(2)}`;
    return (<motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{
            duration: 0.5,
            delay,
            ease: "easeOut",
        }} whileHover={{
            y: -10,
            transition: { duration: 0.3 },
        }}>
      <Card className="overflow-hidden group cursor-pointer">
        <CardContent className="p-0">
          <div className="relative overflow-hidden">
            <motion.img src={image} alt={name} className="w-full h-64 object-cover" whileHover={{ scale: 1.1 }} transition={{ duration: 0.4 }}/>
            <motion.div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100" transition={{ duration: 0.3 }}>
              <motion.button className="bg-white text-black px-6 py-2 rounded-full font-semibold" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                View Details
              </motion.button>
            </motion.div>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{category}</p>
            <h3 className="font-semibold text-lg mb-2">{name}</h3>
            <p className="text-primary font-bold">{displayPrice}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>);
}
export function AnimatedFeatureCard({ icon, title, description, delay = 0 }) {
    return (<motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{
            duration: 0.6,
            delay,
            ease: "easeOut",
        }} whileHover={{
            scale: 1.05,
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            transition: { duration: 0.3 },
        }}>
      <Card className="p-6 h-full">
        <motion.div className="mb-4" whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
          {icon}
        </motion.div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </Card>
    </motion.div>);
}
export function AnimatedSection({ children, className = "" }) {
    return (<motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className={className}>
      {children}
    </motion.div>);
}
export function AnimatedButton({ children, className = "", ...props }) {
    return (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className={className} {...props}>
      {children}
    </motion.button>);
}
export function FadeInWhenVisible({ children, delay = 0 }) {
    return (<motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{
            duration: 0.6,
            delay,
            ease: [0.21, 0.47, 0.32, 0.98],
        }}>
      {children}
    </motion.div>);
}
export function SlideInFromLeft({ children, delay = 0 }) {
    return (<motion.div initial={{ opacity: 0, x: -100 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{
            duration: 0.8,
            delay,
            ease: "easeOut",
        }}>
      {children}
    </motion.div>);
}
export function SlideInFromRight({ children, delay = 0 }) {
    return (<motion.div initial={{ opacity: 0, x: 100 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{
            duration: 0.8,
            delay,
            ease: "easeOut",
        }}>
      {children}
    </motion.div>);
}
export function ScaleIn({ children, delay = 0 }) {
    return (<motion.div initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{
            duration: 0.5,
            delay,
            ease: "easeOut",
        }}>
      {children}
    </motion.div>);
}
export function StaggerContainer({ children, className = "" }) {
    return (<motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={{
            visible: {
                transition: {
                    staggerChildren: 0.1,
                },
            },
        }} className={className}>
      {children}
    </motion.div>);
}
export function StaggerItem({ children }) {
    return (<motion.div variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
        }} transition={{ duration: 0.5 }}>
      {children}
    </motion.div>);
}
