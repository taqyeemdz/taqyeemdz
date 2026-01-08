"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { dbOperations } from "@/lib/db"
import type { Business, Branch } from "@/lib/types"
import { generateId } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BranchesPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    manager: "",
  })

  useEffect(() => {
    const user = dbOperations.getCurrentUser()
    if (user?.business_id) {
      const biz = dbOperations.getBusiness(user.business_id)
      setBusiness(biz || null)

      const branchList = dbOperations.getBranchesByBusiness(user.business_id)
      setBranches(branchList)
    }
  }, [])

  function resetForm() {
    setFormData({ name: "", address: "", phone: "", manager: "" })
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (editingId) {
      const updated = dbOperations.updateBranch(editingId, {
        ...branches.find((b) => b.id === editingId)!,
        ...formData,
        updatedAt: new Date(),
      })
      if (updated) {
        setBranches(branches.map((b) => (b.id === editingId ? updated : b)))
      }
    } else {
      const branch: Branch = {
        id: generateId(),
        business_id: business!.id,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        manager: formData.manager,
        isActive: true,
        createdat: new Date(),
        updatedAt: new Date(),
      }

      const created = dbOperations.createBranch(branch)
      setBranches([...branches, created])
    }

    resetForm()
  }

  function handleEdit(branch: Branch) {
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      manager: branch.manager,
    })
    setEditingId(branch.id)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette succursale ?")) {
      dbOperations.deleteBranch(id)
      setBranches(branches.filter((b) => b.id !== id))
    }
  }

  if (!business) return <div>Chargement...</div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Succursales</h1>
          <p className="text-muted-foreground">Gérez les emplacements de votre entreprise</p>
        </div>
        <Button
          onClick={() => {
            if (showForm && !editingId) {
              setShowForm(false)
            } else {
              resetForm()
              setShowForm(true)
            }
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {showForm && !editingId ? "Annuler" : "Ajouter une succursale"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">{editingId ? "Modifier la succursale" : "Nouvelle succursale"}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de la succursale</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Emplacement centre-ville"
                required
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse de la rue"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+213 xxx xxx xxx"
                  required
                />
              </div>

              <div>
                <Label htmlFor="manager">Nom du responsable</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="Nom du responsable"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                {editingId ? "Mettre à jour la succursale" : "Créer la succursale"}
              </Button>
              <Button type="button" onClick={resetForm} variant="outline" className="flex-1 bg-transparent">
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((branch) => (
          <Card key={branch.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{branch.name}</h3>
                <p className="text-sm text-muted-foreground">{branch.address}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${branch.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
              >
                {branch.isActive ? "Actif" : "Inactif"}
              </span>
            </div>

            <div className="space-y-2 mb-6 pb-6 border-b border-border">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Téléphone</span>
                <span className="font-semibold text-foreground">{branch.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Responsable</span>
                <span className="font-semibold text-foreground">{branch.manager}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => handleEdit(branch)} variant="outline" className="flex-1">
                Modifier
              </Button>
              <Button onClick={() => handleDelete(branch.id)} variant="outline" className="flex-1 text-destructive">
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {branches.length === 0 && !showForm && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Aucune succursale ajoutée pour le moment</p>
          <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Ajoutez votre première succursale
          </Button>
        </Card>
      )}
    </div>
  )
}

