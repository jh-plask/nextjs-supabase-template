"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { processProject } from "@/actions/projects";
import {
  projectFieldConfigs,
  projectFormConfigs,
} from "@/actions/projects/form-config";
import { ProjectSchema } from "@/actions/projects/schema";
import { Button } from "@/components/ui/button";
import { ConfigDrivenDialog } from "@/components/ui/config-driven-dialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { RequirePermission } from "@/lib/rbac";
import { SetPageActions } from "@/lib/sidebar";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectsClientProps {
  initialProjects: Project[];
}

export function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  return (
    <div className="space-y-6">
      <SetPageActions>
        <RequirePermission permission="projects.create">
          <Dialog onOpenChange={setCreateOpen} open={createOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="size-4" />
                  New
                </Button>
              }
            />
          </Dialog>
        </RequirePermission>
      </SetPageActions>

      {initialProjects.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12"
          data-testid="projects-empty"
        >
          <p className="mb-4 text-muted-foreground">No projects yet</p>
          <RequirePermission permission="projects.create">
            <Button onClick={() => setCreateOpen(true)} variant="outline">
              <Plus className="mr-2 size-4" />
              Create your first project
            </Button>
          </RequirePermission>
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="projects-list"
        >
          {initialProjects.map((project) => (
            <div
              className="group relative rounded-lg border p-4 transition-colors hover:bg-accent/50"
              key={project.id}
            >
              <h3 className="font-medium">{project.name}</h3>
              {project.description && (
                <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                  {project.description}
                </p>
              )}
              <p className="mt-2 text-muted-foreground text-xs">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <RequirePermission permission="projects.update">
                  <Button
                    data-testid="project-edit-btn"
                    onClick={() => setEditProject(project)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </RequirePermission>
                <RequirePermission permission="projects.delete">
                  <Button
                    data-testid="project-delete-btn"
                    onClick={() => setDeleteProject(project)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </RequirePermission>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <ConfigDrivenDialog
        action={processProject}
        description={projectFormConfigs.create.description}
        fieldConfigs={projectFieldConfigs}
        hiddenFields={{ operation: "create" }}
        onOpenChange={setCreateOpen}
        open={createOpen}
        schema={ProjectSchema}
        testIdPrefix="project"
        title={projectFormConfigs.create.label}
        uiConfig={projectFormConfigs.create}
      />

      {/* Edit Dialog */}
      <ConfigDrivenDialog
        action={processProject}
        description={projectFormConfigs.update.description}
        fieldConfigs={projectFieldConfigs}
        hiddenFields={{
          operation: "update",
          projectId: editProject?.id ?? "",
        }}
        initialValues={{
          name: editProject?.name ?? "",
          description: editProject?.description ?? "",
        }}
        key={editProject?.id}
        onOpenChange={(open) => !open && setEditProject(null)}
        open={!!editProject}
        schema={ProjectSchema}
        testIdPrefix="project"
        title={projectFormConfigs.update.label}
        uiConfig={projectFormConfigs.update}
      />

      {/* Delete Confirmation Dialog */}
      <ConfigDrivenDialog
        action={processProject}
        description={
          <>
            Are you sure you want to delete &quot;{deleteProject?.name}&quot;?
            This action cannot be undone.
          </>
        }
        fieldConfigs={projectFieldConfigs}
        hiddenFields={{
          operation: "delete",
          projectId: deleteProject?.id ?? "",
        }}
        key={`delete-${deleteProject?.id}`}
        onOpenChange={(open) => !open && setDeleteProject(null)}
        open={!!deleteProject}
        schema={ProjectSchema}
        submitVariant="destructive"
        testIdPrefix="project"
        title={projectFormConfigs.delete.label}
        uiConfig={projectFormConfigs.delete}
      />
    </div>
  );
}
