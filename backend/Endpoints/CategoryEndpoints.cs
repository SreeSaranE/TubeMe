using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Endpoints
{
    public static class CategoryEndpoints
    {
        public static RouteGroupBuilder MapCategoryEndpoints(this RouteGroupBuilder group)
        {
            group.MapGet("/", (ICategoryService categoryService) =>
            {
                return Results.Ok(categoryService.GetCategories());
            });

            group.MapPost("/", (CreateCategoryRequest request, ICategoryService categoryService) =>
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return Results.BadRequest(new { message = "Category name cannot be empty." });
                }

                bool added = categoryService.AddCategory(request.Name.Trim());
                if (!added)
                {
                    return Results.Conflict(new { message = "Category already exists." });
                }

                return Results.Ok(categoryService.GetCategories());
            });

            group.MapPut("/{name}", (string name, UpdateCategoryRequest request, ICategoryService categoryService) =>
            {
                if (string.IsNullOrWhiteSpace(request.NewName))
                {
                    return Results.BadRequest(new { message = "New category name cannot be empty." });
                }

                bool renamed = categoryService.RenameCategory(Uri.UnescapeDataString(name), request.NewName.Trim());
                if (!renamed)
                {
                    return Results.BadRequest(new { message = "Failed to rename. Category may not exist or new name already taken." });
                }

                return Results.Ok(categoryService.GetCategories());
            });

            group.MapDelete("/{name}", (string name, ICategoryService categoryService) =>
            {
                string cleanName = Uri.UnescapeDataString(name);
                if (cleanName.Equals("General", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.BadRequest(new { message = "Default 'General' category cannot be deleted." });
                }

                bool deleted = categoryService.DeleteCategory(cleanName);
                if (!deleted)
                {
                    return Results.NotFound(new { message = "Category not found." });
                }

                return Results.Ok(categoryService.GetCategories());
            });

            return group;
        }
    }
}
