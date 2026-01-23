"use client"

import { useState } from "react"
import { MessageCircle, DollarSign, FileQuestion, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false)

  const contacts = [
    {
      number: "+573176990677",
      label: "Información de Pago",
      icon: DollarSign,
      message: "Hola, necesito información sobre el pago del retiro",
    },
    {
      number: "+573162837638",
      label: "Problemas con Formulario",
      icon: FileQuestion,
      message: "Hola, tengo un problema con el formulario de inscripción",
    },
  ]

  const handleWhatsAppClick = (number: string, message: string) => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">¿En qué podemos ayudarte?</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {contacts.map((contact) => {
              const Icon = contact.icon
              return (
                <button
                  key={contact.number}
                  onClick={() => handleWhatsAppClick(contact.number, contact.message)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {contact.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enviar WhatsApp
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="h-16 w-16 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white p-2"
      >
        {isOpen ? (
          <X className="h-10 w-10" />
        ) : (
          <MessageCircle className="h-10 w-10" />
        )}
      </Button>
    </div>
  )
}
